// app/category/[id].tsx
import { useLocalSearchParams, useRouter } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import { getDownloadURL, getStorage, ref } from "firebase/storage";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  FlatList,
  GestureResponderEvent,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  ViewProps,
} from "react-native";
import {
  State as GHState,
  PinchGestureHandler,
  PinchGestureHandlerGestureEvent,
  PinchGestureHandlerStateChangeEvent,
} from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";
import { db } from "../../src/firebaseConfig";

const HORIZONTAL_PADDING = 0;
const CARD_ASPECT = 0.55; // relative height proportion (you can change)
const ITEM_SPACING = 0; // no spacing between items when full-width

/**
 * SafeView
 * - For this file only: wraps children so any plain-string child is wrapped with <Text>
 * - This prevents "Unexpected text node" errors on web where a string appears directly inside a View.
 * - For normal children (elements, arrays, numbers), it forwards them unchanged.
 */
function SafeView(props: ViewProps & { children?: any }) {
  const { children, ...rest } = props;

  // helper to wrap plain string/number into Text
  const wrapChild = (child: any, idx?: number) => {
    if (child === null || child === undefined) return child;
    if (typeof child === "string" || typeof child === "number") {
      // preserve whitespace and styling if needed by letting caller style <Text>
      return (
        <Text key={idx} selectable={false}>
          {String(child)}
        </Text>
      );
    }
    return child;
  };

  // normalize children array and wrap strings
  if (Array.isArray(children)) {
    const wrapped = children.map((c, i) => wrapChild(c, i));
    return <View {...rest}>{wrapped}</View>;
  } else {
    return <View {...rest}>{wrapChild(children)}</View>;
  }
}

export default function CategoryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const storage = getStorage();

  const { width: runtimeWidth, height: runtimeHeight } = useWindowDimensions();
  const CARD_WIDTH = Math.round(runtimeWidth);
  const CARD_HEIGHT = Math.round(runtimeHeight * CARD_ASPECT);
  const ITEM_FULL_LENGTH = CARD_WIDTH;

  const [category, setCategory] = useState<any | null>(null);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fullscreenOpen, setFullscreenOpen] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const flatListRef = useRef<FlatList<string> | null>(null);

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: any[] }) => {
      if (viewableItems && viewableItems.length > 0) {
        const index = viewableItems[0].index ?? 0;
        setCurrentIndex(index);
        animateFade(index);
      }
    }
  ).current;

  useEffect(() => {
    if (!id) return;
    let mounted = true;

    const fetchCategory = async () => {
      try {
        setLoading(true);
        const docRef = doc(db, "categories", String(id));
        const snap = await getDoc(docRef);

        if (!snap.exists()) {
          if (mounted) {
            setCategory(null);
            setImageUrls([]);
          }
          return;
        }

        const data = snap.data();
        if (!mounted) return;

        setCategory({ id: snap.id, ...data });

        const rawImages = data.images ?? data.image ?? data.imagesArray;
        let imagesArray: string[] =
          Array.isArray(rawImages)
            ? rawImages
                .map((it: any) =>
                  typeof it === "string" ? it : it?.url ?? it?.downloadURL ?? it?.path ?? null
                )
                .filter(Boolean)
            : typeof rawImages === "string" && rawImages.includes(",")
            ? rawImages.split(",").map((p: string) => p.trim()).filter(Boolean)
            : typeof rawImages === "string" && rawImages.length
            ? [rawImages]
            : [];

        if ((!imagesArray || imagesArray.length === 0) && data.imageUrl) {
          imagesArray = [data.imageUrl];
        }

        const resolved = await Promise.all(
          imagesArray.map(async (candidate: string) => {
            if (!candidate) return null;
            if (/^https?:\/\//i.test(candidate)) return candidate;
            try {
              return await getDownloadURL(ref(storage, candidate));
            } catch {
              try {
                const stripped = candidate.replace(/^gs:\/\/[^/]+\//i, "");
                return await getDownloadURL(ref(storage, stripped));
              } catch {
                return null;
              }
            }
          })
        );

        if (mounted) {
          const final = resolved.filter(Boolean) as string[];
          setImageUrls(final);
          setCurrentIndex(0);
          try {
            flatListRef.current?.scrollToOffset({ offset: 0, animated: false } as any);
          } catch {
            /* ignore */
          }
        }
      } catch (err) {
        console.warn("fetchCategory error:", err);
        if (mounted) {
          setCategory(null);
          setImageUrls([]);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchCategory();
    return () => {
      mounted = false;
    };
  }, [id, storage]);

  const animateFade = useCallback(
    (toIndex: number) => {
      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 220,
        useNativeDriver: Platform.OS !== "web",
      }).start();
    },
    [fadeAnim]
  );

  const handlePrev = useCallback(() => {
    const newIndex = Math.max(0, currentIndex - 1);
    if (newIndex === currentIndex) return;
    try {
      flatListRef.current?.scrollToIndex({ index: newIndex, animated: true });
    } catch {
      flatListRef.current?.scrollToOffset({ offset: newIndex * ITEM_FULL_LENGTH, animated: true } as any);
    }
    setCurrentIndex(newIndex);
    animateFade(newIndex);
  }, [currentIndex, animateFade]);

  const handleNext = useCallback(() => {
    const newIndex = Math.min(imageUrls.length - 1, currentIndex + 1);
    if (newIndex === currentIndex) return;
    try {
      flatListRef.current?.scrollToIndex({ index: newIndex, animated: true });
    } catch {
      flatListRef.current?.scrollToOffset({ offset: newIndex * ITEM_FULL_LENGTH, animated: true } as any);
    }
    setCurrentIndex(newIndex);
    animateFade(newIndex);
  }, [currentIndex, imageUrls.length, animateFade]);

  const onPressShare = async () => {
    const url = imageUrls[currentIndex] ?? undefined;
    try {
      await Share.share({
        message: `${category?.name ?? "Image"}${url ? `\n${url}` : ""}`,
        url,
        title: category?.name ?? "Image",
      } as any);
    } catch (err) {
      console.warn("Share error", err);
    }
  };

  const openFullscreen = () => setFullscreenOpen(true);
  const closeFullscreen = () => setFullscreenOpen(false);

  if (loading) {
    return (
      <SafeView style={styles.centered}>
        <StatusBar barStyle="light-content" />
        <ActivityIndicator size="large" color="#fff" />
      </SafeView>
    );
  }

  if (!category) {
    return (
      <SafeView style={styles.centered}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
      </SafeView>
    );
  }

  const name = category.name ?? category.title ?? category.categoryName ?? category.label ?? "";
  const description = category.description ?? category.details ?? category.caption ?? "";

  const imagesForList = imageUrls && imageUrls.length ? imageUrls : [];

  return (
    <SafeAreaView style={styles.page}>
      <StatusBar barStyle="light-content" />
      {/* Header */}
      <SafeView style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.headerBack}>
          <Text style={styles.headerBackText}>← Back</Text>
        </Pressable>

        <Text style={styles.headerTitle} numberOfLines={1} ellipsizeMode="tail">
          {name}
        </Text>

        <SafeView style={{ width: 64 }} />
      </SafeView>

      {/* Image Card Area (single full-width image) */}
      <SafeView style={[styles.cardArea, { height: CARD_HEIGHT }]}>
        {imagesForList.length === 0 ? (
          <SafeView style={[styles.card, styles.emptyCard]}>
            <Text style={{ color: "#888" }}>No images available</Text>
          </SafeView>
        ) : (
          <Animated.View style={{ opacity: fadeAnim, width: CARD_WIDTH }}>
            <FlatList
              ref={flatListRef}
              data={imagesForList}
              keyExtractor={(it, idx) => `${idx}-${it}`}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              snapToInterval={ITEM_FULL_LENGTH}
              decelerationRate="fast"
              renderItem={({ item }) => (
                <SafeView style={{ width: CARD_WIDTH, height: CARD_HEIGHT, alignItems: "center", justifyContent: "center" }}>
                  <SafeView style={{ width: "100%", height: "100%", borderRadius: 0, overflow: "hidden", backgroundColor: "#000", justifyContent: "center", alignItems: "center" }}>
                    <ZoomableImage uri={item} width={CARD_WIDTH} height={CARD_HEIGHT} onTap={openFullscreen} />
                  </SafeView>
                </SafeView>
              )}
              onViewableItemsChanged={onViewableItemsChanged}
              viewabilityConfig={viewabilityConfig}
              initialNumToRender={1}
              maxToRenderPerBatch={2}
              windowSize={3}
              getItemLayout={(_, index) => ({
                length: ITEM_FULL_LENGTH,
                offset: ITEM_FULL_LENGTH * index,
                index,
              })}
              removeClippedSubviews={Platform.OS === "android"}
            />

            {/* arrows / index / share */}
            {imagesForList.length > 1 && (
              <>
                <Pressable
                  onPress={handlePrev}
                  disabled={currentIndex === 0}
                  style={[styles.arrow, { left: 8, opacity: currentIndex === 0 ? 0.35 : 1 }]}
                >
                  <Text style={styles.arrowText}>‹</Text>
                </Pressable>

                <Pressable
                  onPress={handleNext}
                  disabled={currentIndex === imagesForList.length - 1}
                  style={[styles.arrow, { right: 8, opacity: currentIndex === imagesForList.length - 1 ? 0.35 : 1 }]}
                >
                  <Text style={styles.arrowText}>›</Text>
                </Pressable>

                <SafeView style={styles.indexBadge}>
                  <Text style={styles.indexBadgeText}>
                    {currentIndex + 1} / {imagesForList.length}
                  </Text>
                </SafeView>
              </>
            )}

            <Pressable onPress={onPressShare} style={styles.shareButton}>
              <Text style={styles.shareText}>Share</Text>
            </Pressable>
          </Animated.View>
        )}
      </SafeView>

      {/* Description below images */}
      <SafeView style={styles.descriptionArea}>
        <ScrollView style={{ maxHeight: 140 }} showsVerticalScrollIndicator>
          <Text style={styles.descriptionText}>{description || "No description available."}</Text>
        </ScrollView>
      </SafeView>

      {/* Fullscreen Modal */}
      <Modal visible={fullscreenOpen} animationType="fade" onRequestClose={closeFullscreen} transparent={false}>
        <SafeView style={styles.fullscreenHeader}>
          <Pressable onPress={closeFullscreen}>
            <Text style={styles.fullscreenClose}>✕</Text>
          </Pressable>
          <Text style={styles.fullscreenTitle}>{name}</Text>
          <SafeView style={{ width: 40 }} />
        </SafeView>

        <SafeView style={styles.fullscreenContent}>
          <FlatList
            data={imagesForList}
            keyExtractor={(it, idx) => `${idx}-${it}`}
            horizontal
            pagingEnabled
            initialScrollIndex={currentIndex}
            getItemLayout={(_, index) => ({ length: runtimeWidth, offset: runtimeWidth * index, index })}
            renderItem={({ item }) => (
              <SafeView style={{ width: runtimeWidth, height: runtimeHeight, alignItems: "center", justifyContent: "center", backgroundColor: "#000" }}>
                <ZoomableImage uri={item} width={runtimeWidth} height={runtimeHeight * 0.92} />
              </SafeView>
            )}
          />
        </SafeView>
      </Modal>
    </SafeAreaView>
  );
}

/**
 * ZoomableImage - pinch to zoom + double-tap implemented via onPress timing.
 */
function ZoomableImage({ uri, width, height, onTap }: { uri: string; width: number; height: number; onTap?: () => void }) {
  const baseScale = useRef(new Animated.Value(1)).current;
  const pinchScale = useRef(new Animated.Value(1)).current;
  const lastScale = useRef(1);
  const doubleTapRef = useRef<number | null>(null);

  const onPinchEvent = Animated.event<PinchGestureHandlerGestureEvent>(
    [{ nativeEvent: { scale: pinchScale } }],
    { useNativeDriver: Platform.OS !== "web" }
  );

  const onPinchStateChange = (event: PinchGestureHandlerStateChangeEvent) => {
    if (event.nativeEvent.oldState === GHState.ACTIVE) {
      let newScale = lastScale.current * event.nativeEvent.scale;
      newScale = Math.max(1, Math.min(newScale, 4));
      lastScale.current = newScale;
      baseScale.setValue(newScale);
      pinchScale.setValue(1);
    }
  };

  const animatedScale = Animated.multiply(baseScale, pinchScale);

  const handlePress = (_e?: GestureResponderEvent) => {
    const now = Date.now();
    const last = doubleTapRef.current ?? 0;

    if (now - last < 300) {
      const toValue = lastScale.current > 1.1 ? 1 : 2;
      lastScale.current = toValue;
      Animated.timing(baseScale, { toValue, duration: 200, useNativeDriver: Platform.OS !== "web" }).start(() => {
        pinchScale.setValue(1);
      });
      doubleTapRef.current = null;
      return;
    }

    doubleTapRef.current = now;

    setTimeout(() => {
      if (doubleTapRef.current === now) {
        doubleTapRef.current = null;
        if (lastScale.current > 1.05) {
          lastScale.current = 1;
          Animated.timing(baseScale, { toValue: 1, duration: 200, useNativeDriver: Platform.OS !== "web" }).start(() => {
            pinchScale.setValue(1);
          });
          return;
        }
        if (onTap) {
          onTap();
        }
      }
    }, 320);
  };

  return (
    <PinchGestureHandler onGestureEvent={onPinchEvent} onHandlerStateChange={onPinchStateChange}>
      <Animated.View style={{ width, height, alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
        <Pressable onPress={handlePress} style={{ width, height, alignItems: "center", justifyContent: "center" }}>
          <Animated.Image
            source={{ uri }}
            style={[
              {
                width: width ?? 100,
                height: height ?? 100,
                transform: [{ scale: animatedScale }],
              } as any,
            ]}
            resizeMode="contain"
            onError={(e) => {
              console.warn("Image load error:", e.nativeEvent?.error);
            }}
          />
        </Pressable>
      </Animated.View>
    </PinchGestureHandler>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: "#000",
  },
  centered: {
    flex: 1,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
  },
  backText: { color: "#fff" },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerBack: { padding: 6 },
  headerBackText: { color: "#fff", fontSize: 14 },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "700", flex: 1, textAlign: "center" },

  cardArea: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#000",
  },

  cardFull: {
    width: "100%",
    height: "100%",
    borderRadius: 0,
    overflow: "hidden",
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },

  card: {
    width: "100%",
    height: "100%",
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#111",
    justifyContent: "center",
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.25,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
      },
      android: {
        elevation: 6,
      },
    }),
  },

  emptyCard: {
    alignItems: "center",
    justifyContent: "center",
  },

  arrow: {
    position: "absolute",
    top: "45%",
    zIndex: 30,
    padding: 8,
    backgroundColor: "rgba(0,0,0,0.45)",
    borderRadius: 20,
  },
  arrowText: { color: "#fff", fontSize: 28 },
  indexBadge: {
    position: "absolute",
    right: 16,
    bottom: 12,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 12,
  },
  indexBadgeText: { color: "#fff", fontSize: 12 },
  shareButton: {
    position: "absolute",
    left: 16,
    bottom: 16,
    backgroundColor: "rgba(255,255,255,0.06)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  shareText: { color: "#fff", fontSize: 13 },

  descriptionArea: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopColor: "#222",
    borderTopWidth: 1,
    backgroundColor: "#000",
  },
  descriptionText: {
    color: "#ddd",
    fontSize: 14,
    lineHeight: 20,
  },

  fullscreenHeader: {
    height: 56,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "space-between",
    flexDirection: "row",
    paddingHorizontal: 12,
  },
  fullscreenClose: { color: "#fff", fontSize: 22 },
  fullscreenTitle: { color: "#fff", fontSize: 16, fontWeight: "600" },
  fullscreenContent: { flex: 1, backgroundColor: "#000" },
});
