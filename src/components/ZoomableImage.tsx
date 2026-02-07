import React, { useEffect } from 'react';
import { StyleSheet, Image, View, Text, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';

interface ZoomableImageProps {
  uri: string;
  onToggleControls?: () => void;
  onZoomStateChange?: (isZoomed: boolean) => void;
}

export const ZoomableImage: React.FC<ZoomableImageProps> = ({ uri, onToggleControls, onZoomStateChange }) => {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  // Reset zoom when image changes
  useEffect(() => {
    scale.value = 1;
    savedScale.value = 1;
    translateX.value = 0;
    translateY.value = 0;
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
    // Notify parent that zoom is reset when image changes
    if (onZoomStateChange) {
      onZoomStateChange(false);
    }
  }, [uri, scale, savedScale, translateX, translateY, savedTranslateX, savedTranslateY, onZoomStateChange]);

  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = savedScale.value * e.scale;
    })
    .onEnd(() => {
      // Limit zoom out to 1x
      if (scale.value < 1) {
        scale.value = withTiming(1);
        translateX.value = withTiming(0);
        translateY.value = withTiming(0);
        savedScale.value = 1;
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
        if (onZoomStateChange) {
          runOnJS(onZoomStateChange)(false);
        }
      } else if (scale.value > 5) {
        // Limit zoom in to 5x
        scale.value = withTiming(5);
        savedScale.value = 5;
        if (onZoomStateChange) {
          runOnJS(onZoomStateChange)(true);
        }
      } else {
        savedScale.value = scale.value;
        if (onZoomStateChange) {
          runOnJS(onZoomStateChange)(scale.value > 1);
        }
      }
    });

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      // Only allow panning when zoomed in
      if (savedScale.value > 1) {
        const maxTranslateX = (screenWidth * (savedScale.value - 1)) / 2;
        const maxTranslateY = (screenHeight * 0.8 * (savedScale.value - 1)) / 2;

        const newTranslateX = savedTranslateX.value + e.translationX;
        const newTranslateY = savedTranslateY.value + e.translationY;

        // Clamp translation to prevent panning too far
        translateX.value = Math.max(-maxTranslateX, Math.min(maxTranslateX, newTranslateX));
        translateY.value = Math.max(-maxTranslateY, Math.min(maxTranslateY, newTranslateY));
      }
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    })
    .manualActivation(true)
    .onTouchesMove((e, state) => {
      // Only activate pan gesture when zoomed in
      if (savedScale.value > 1) {
        state.activate();
      } else {
        state.fail();
      }
    });

  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd((e) => {
      if (scale.value > 1) {
        // Zoom out to 1x
        scale.value = withTiming(1);
        translateX.value = withTiming(0);
        translateY.value = withTiming(0);
        savedScale.value = 1;
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
        if (onZoomStateChange) {
          runOnJS(onZoomStateChange)(false);
        }
      } else {
        // Zoom in to 2.5x at tap location
        const newScale = 2.5;
        scale.value = withTiming(newScale);
        savedScale.value = newScale;

        // Calculate translation to center on tap point
        const focalX = e.x - screenWidth / 2;
        const focalY = e.y - screenHeight / 2;

        translateX.value = withTiming(-focalX * (newScale - 1) / newScale);
        translateY.value = withTiming(-focalY * (newScale - 1) / newScale);
        savedTranslateX.value = -focalX * (newScale - 1) / newScale;
        savedTranslateY.value = -focalY * (newScale - 1) / newScale;
        if (onZoomStateChange) {
          runOnJS(onZoomStateChange)(true);
        }
      }
    });

  const singleTapGesture = Gesture.Tap()
    .numberOfTaps(1)
    .onEnd(() => {
      if (onToggleControls) {
        runOnJS(onToggleControls)();
      }
    });

  // Compose gestures:
  // - Double-tap takes priority over single-tap
  // - Pinch and pan can happen simultaneously
  // - All gestures work together
  const composedGesture = Gesture.Simultaneous(
    pinchGesture,
    panGesture,
    Gesture.Exclusive(doubleTapGesture, singleTapGesture)
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  const hasValidUri = uri && uri.trim() !== '';

  // Dynamic styles based on screen dimensions
  const dynamicStyles = {
    container: {
      width: screenWidth,
      height: screenHeight,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
    },
    image: {
      width: screenWidth,
      height: screenHeight * 0.8,
    },
    placeholderContainer: {
      width: screenWidth,
      height: screenHeight * 0.8,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      backgroundColor: colors.surface,
    },
  };

  return (
    <GestureDetector gesture={composedGesture}>
      <Animated.View style={[dynamicStyles.container, animatedStyle]}>
        {hasValidUri ? (
          <Image
            source={{ uri }}
            style={dynamicStyles.image}
            resizeMode="contain"
          />
        ) : (
          <View style={dynamicStyles.placeholderContainer}>
            <Ionicons name="image-outline" size={100} color={colors.textSecondary} />
            <Text style={styles.placeholderText}>Image not available</Text>
          </View>
        )}
      </Animated.View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  placeholderText: {
    color: colors.textSecondary,
    marginTop: 16,
    fontSize: 16,
  },
});

