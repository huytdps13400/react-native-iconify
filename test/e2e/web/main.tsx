import React, { useCallback, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Text, View } from 'react-native';
import { IconifyIcon } from '@huymobile/react-native-iconify';

function SuccessFixture() {
  const [generation, setGeneration] = useState(0);
  const [loadCount, setLoadCount] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLoad = useCallback(() => {
    setLoadCount(count => count + 1);
  }, []);

  const handleError = useCallback((error: Error) => {
    setErrorMessage(error.message);
  }, []);

  return (
    <View>
      <IconifyIcon
        key={generation}
        name="e2e:web"
        size={40}
        color="#123456"
        testID="remote-icon"
        onLoad={handleLoad}
        onError={handleError}
      />
      <Text testID="load-count">{loadCount}</Text>
      <Text testID="error-message">{errorMessage}</Text>
      <button
        data-testid="remount-icon"
        type="button"
        onClick={() => setGeneration(value => value + 1)}
      >
        Remount icon
      </button>
    </View>
  );
}

function ErrorFixture() {
  const [errorMessage, setErrorMessage] = useState('');

  const handleError = useCallback((error: Error) => {
    setErrorMessage(error.message);
  }, []);

  return (
    <View>
      <IconifyIcon
        name="e2e:missing"
        fallback={<Text testID="icon-fallback">Fallback</Text>}
        onError={handleError}
      />
      <Text testID="error-message">{errorMessage}</Text>
    </View>
  );
}

const fixture = new URLSearchParams(window.location.search).get('fixture');
const root = createRoot(document.getElementById('root')!);
root.render(fixture === 'error' ? <ErrorFixture /> : <SuccessFixture />);
