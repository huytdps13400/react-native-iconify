// Copyright 2025-present React Native Iconify. All rights reserved.

#import <React/RCTBridgeModule.h>
#import <SDWebImage/SDImageCache.h>

static NSString *const kCacheKeyPrefix = @"turbo-cache:";

@interface TurboCacheModule : NSObject <RCTBridgeModule>
@end

@implementation TurboCacheModule

RCT_EXPORT_MODULE(TurboCache)

+ (BOOL)requiresMainQueueSetup {
  return NO;
}

- (SDImageCache *)cache {
  return [SDImageCache sharedImageCache];
}

- (NSString *)createCacheKey:(NSString *)key {
  return [kCacheKeyPrefix stringByAppendingString:key];
}

- (dispatch_queue_t)methodQueue {
  return dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0);
}

RCT_EXPORT_METHOD(getValue:(NSString *)key
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
  NSString *cacheKey = [self createCacheKey:key];

  // Use synchronous disk read (already on background queue)
  NSData *data = [[self cache] diskImageDataForKey:cacheKey];

  if (!data) {
    resolve([NSNull null]);
    return;
  }

  @try {
    NSError *jsonError;
    NSDictionary *jsonDict = [NSJSONSerialization JSONObjectWithData:data options:0 error:&jsonError];

    if (jsonDict && jsonDict[@"value"]) {
      NSString *value = jsonDict[@"value"];
      NSNumber *expiresAt = jsonDict[@"expiresAt"];

      // Check if expired
      if (expiresAt && ![expiresAt isEqual:[NSNull null]]) {
        NSTimeInterval now = [[NSDate date] timeIntervalSince1970];
        if (now > [expiresAt doubleValue]) {
          resolve([NSNull null]);
          return;
        }
      }

      resolve(value);
      return;
    }

    // Fallback: try as plain string
    NSString *stringValue = [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding];
    resolve(stringValue ?: [NSNull null]);

  } @catch (NSException *exception) {
    reject(@"CACHE_ERROR", [NSString stringWithFormat:@"Failed to decode cached data for key: %@", key], nil);
  }
}

RCT_EXPORT_METHOD(setValue:(NSString *)key
                  value:(NSString *)value
                  ttl:(nonnull NSNumber *)ttl
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
  NSString *cacheKey = [self createCacheKey:key];

  @try {
    NSMutableDictionary *cacheData = [NSMutableDictionary dictionary];
    cacheData[@"value"] = value;

    if (ttl && ![ttl isEqual:[NSNull null]] && [ttl intValue] > 0) {
      NSTimeInterval expiresAt = [[NSDate date] timeIntervalSince1970] + ([ttl doubleValue] / 1000.0);
      cacheData[@"expiresAt"] = @(expiresAt);
    }

    NSError *error;
    NSData *jsonData = [NSJSONSerialization dataWithJSONObject:cacheData options:0 error:&error];

    if (error) {
      reject(@"CACHE_ERROR", [NSString stringWithFormat:@"Failed to encode value for key: %@", key], error);
      return;
    }

    [[self cache] storeImageData:jsonData forKey:cacheKey completion:^{
      resolve([NSNull null]);
    }];

  } @catch (NSException *exception) {
    reject(@"CACHE_ERROR", [NSString stringWithFormat:@"Failed to store value for key: %@", key], nil);
  }
}

RCT_EXPORT_METHOD(remove:(NSString *)key
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
  NSString *cacheKey = [self createCacheKey:key];

  [[self cache] removeImageForKey:cacheKey fromDisk:YES withCompletion:^{
    resolve([NSNull null]);
  }];
}

RCT_EXPORT_METHOD(clear:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
  [[self cache] clearDiskOnCompletion:^{
    resolve([NSNull null]);
  }];
}

RCT_EXPORT_METHOD(getSize:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
  [[self cache] calculateSizeWithCompletionBlock:^(NSUInteger fileCount, NSUInteger totalSize) {
    resolve(@(totalSize));
  }];
}

RCT_EXPORT_METHOD(clearMemoryCache:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
  [[self cache] clearMemory];
  resolve(@YES);
}

RCT_EXPORT_METHOD(clearDiskCache:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
  [[self cache] clearDiskOnCompletion:^{
    resolve(@YES);
  }];
}

@end
