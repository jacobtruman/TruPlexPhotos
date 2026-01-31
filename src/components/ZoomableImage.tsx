import React from 'react';
import { StyleSheet, Image, View, Text, Dimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withDecay,
  runOnJS,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ZoomableImageProps {
  uri: string;
  onToggleControls?: () => void;
}

export const ZoomableImage: React.FC<ZoomableImageProps> = ({ uri, onToggleControls }) => {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

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
      } else if (scale.value > 5) {
        // Limit zoom in to 5x
        scale.value = withTiming(5);
        savedScale.value = 5;
      } else {
        savedScale.value = scale.value;
      }
    });

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      // Only allow panning when zoomed in
      if (savedScale.value > 1) {
        const maxTranslateX = (SCREEN_WIDTH * (savedScale.value - 1)) / 2;
        const maxTranslateY = (SCREEN_HEIGHT * 0.8 * (savedScale.value - 1)) / 2;

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
      } else {
        // Zoom in to 2.5x at tap location
        const newScale = 2.5;
        scale.value = withTiming(newScale);
        savedScale.value = newScale;

        // Calculate translation to center on tap point
        const focalX = e.x - SCREEN_WIDTH / 2;
        const focalY = e.y - SCREEN_HEIGHT / 2;
        
        translateX.value = withTiming(-focalX * (newScale - 1) / newScale);
        translateY.value = withTiming(-focalY * (newScale - 1) / newScale);
        savedTranslateX.value = -focalX * (newScale - 1) / newScale;
        savedTranslateY.value = -focalY * (newScale - 1) / newScale;
      }
    });

  const singleTapGesture = Gesture.Tap()
    .numberOfTaps(1)
    .onEnd(() => {
      if (onToggleControls) {
        runOnJS(onToggleControls)();
      }
    });

  const composedGesture = Gesture.Simultaneous(
    Gesture.Exclusive(doubleTapGesture, singleTapGesture),
    Gesture.Simultaneous(pinchGesture, panGesture)
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  const hasValidUri = uri && uri.trim() !== '';

  return (
    <GestureDetector gesture={composedGesture}>
      <Animated.View style={[styles.container, animatedStyle]}>
        {hasValidUri ? (
          <Image
            source={{ uri }}
            style={styles.image}
            resizeMode="contain"
          />
        ) : (
          <View style={styles.placeholderContainer}>
            <Ionicons name="image-outline" size={100} color={colors.textSecondary} />
            <Text style={styles.placeholderText}>Image not available</Text>
          </View>
        )}
      </Animated.View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.8,
  },
  placeholderContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  placeholderText: {
    color: colors.textSecondary,
    marginTop: 16,
    fontSize: 16,
  },
});

