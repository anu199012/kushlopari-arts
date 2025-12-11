// app/(tabs)/index.tsx
import { useRouter } from "expo-router";
import { collection, getDocs } from "firebase/firestore";
import { getDownloadURL, getStorage, ref } from "firebase/storage";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Easing,
  FlatList,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { db } from "../../src/firebaseConfig";

// ===== Ignore ONLY the noisy pointerEvents warning on Web =====
if (
  typeof global !== "undefined" &&
  global?.process?.env?.NODE_ENV !== "production"
) {
  const _warn = console.warn;
  console.warn = (...args) => {
    try {
      if (
        typeof args[0] === "string" &&
        args[0].includes("props.pointerEvents is deprecated")
      ) {
        return; // ignore this warning only
      }
    } catch {}
    _warn(...args);
  };
}
// =================================================================

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const HORIZONTAL_PADDING = 32;
const GAP = 12;
const MIN_CARD_WIDTH = 140;
const MAX_COLUMNS = 6;

export default function HomeScreen() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");

  const storage = getStorage();
  const router = useRouter();
  const { width } = useWindowDimensions();

  const floatAnims = useRef(new Map<string, Animated.ValueXY>()).current;

  // ========== FETCH DATA ==========
  useEffect(() => {
    const fetch = async () => {
      try {
        const snap = await getDocs(collection(db, "categories"));
        const list: any[] = [];
        snap.forEach((d) => list.push({ id: d.id, ...d.data() }));

        const resolved = await Promise.all(
          list.map(async (item) => {
            if (!item.imageUrl) return item;

            try {
              const url = item.imageUrl.startsWith("http")
                ? item.imageUrl
                : await getDownloadURL(
                    ref(storage, item.imageUrl.replace(/^gs:\/\/[^/]+\//, ""))
                  );
              return { ...item, thumbnailImage: url };
            } catch {
              return item;
            }
          })
        );

        // init float animation values
        resolved.forEach((item) => {
          if (!floatAnims.has(item.id)) {
            floatAnims.set(item.id, new Animated.ValueXY({ x: 0, y: 0 }));
          }
        });

        // === SET DATA (and debug if any item label is ".") ===
        setData(resolved);

        // TEMP DEBUG: if any category label is exactly ".", it will log the whole item
        resolved.forEach(item => {
          const label = String(item.name ?? item.title ?? item.categoryName ?? item.id ?? "").trim();
          if (label === ".") {
            console.warn("DEBUG: found dot item in categories:", item);
          }
        });
        // ====================================================

      } catch (err) {
        console.warn("fetch categories error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, [storage]);
  // =================================

  // ===== FLOATING ANIMATION =====
  useEffect(() => {
    if (!data.length) return;
    if (hoveredId || searchText.trim()) return;

    const animations: Animated.CompositeAnimation[] = [];

    data.forEach((item, index) => {
      const anim = floatAnims.get(item.id);
      if (!anim) return;

      const dx = ((index % 3) - 1) * 4;
      const dy = ((index % 4) - 1.5) * 4;

      animations.push(
        Animated.loop(
          Animated.sequence([
            Animated.timing(anim, {
              toValue: { x: dx, y: dy },
              duration: 7000,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: Platform.OS !== "web",
            }),
            Animated.timing(anim, {
              toValue: { x: 0, y: 0 },
              duration: 7000,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: Platform.OS !== "web",
            }),
          ])
        )
      );
    });

    animations.forEach((a) => a.start());

    return () => {
      animations.forEach((a) => a.stop());
      floatAnims.forEach((anim) => anim.setValue({ x: 0, y: 0 }));
    };
  }, [data, hoveredId, searchText]);
  // =================================

  // ===== RESPONSIVE COLUMNS =====
  const computeNumColumns = () => {
    const available = Math.max(width, SCREEN_WIDTH) - HORIZONTAL_PADDING;
    const ideal = Math.floor(available / (MIN_CARD_WIDTH + GAP));
    const minCols = width < 480 ? 2 : 3;
    return Math.min(Math.max(ideal, minCols), MAX_COLUMNS);
  };

  const numColumns = computeNumColumns();

  const cardWidth = Math.floor(
    (width - HORIZONTAL_PADDING - GAP * (numColumns - 1)) / numColumns
  );
  const cardHeight = Math.round(cardWidth * 1.25);

  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  // ===== RENDER ITEM =====
  const renderItem = ({ item }: { item: any }) => {
    const floatAnim = floatAnims.get(item.id);

    const name =
      item.name ?? item.title ?? item.categoryName ?? String(item.id);

    const active =
      hoveredId === String(item.id) ||
      (searchText && name.toLowerCase().includes(searchText.toLowerCase()));

    return (
      <Animated.View
        style={[
          floatAnim ? { transform: floatAnim.getTranslateTransform() } : undefined,
          { marginBottom: GAP },
        ]}
      >
        <Pressable
          onHoverIn={() => setHoveredId(String(item.id))}
          onHoverOut={() => setHoveredId(null)}
          onPress={() =>
            router.push({
              pathname: "/category/[id]",
              params: { id: String(item.id) },
            })
          }
          style={{
            width: cardWidth,
            height: cardHeight,
            backgroundColor: "#111",
            borderRadius: 12,
            overflow: "hidden",
            borderWidth: active ? 1 : 0,
            borderColor: "#fff",
          }}
        >
          {item.thumbnailImage && (
            <Image
              source={{ uri: item.thumbnailImage }}
              style={{ width: "100%", height: "100%" }}
              resizeMode="cover"
            />
          )}

          {active && (
            <View
              style={{
                position: "absolute",
                bottom: 10,
                left: 10,
                right: 10,
                padding: 6,
                backgroundColor: "white",
                borderRadius: 6,
              }}
            >
              <Text style={{ color: "black", fontSize: 12 }} numberOfLines={2}>
                {name}
              </Text>
            </View>
          )}
        </Pressable>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "black" }}>
      <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Kushlopari Arts 🎨</Text>

          <View style={{ marginLeft: 12, flex: 1, maxWidth: 260 }}>
            <TextInput
              value={searchText}
              onChangeText={setSearchText}
              placeholder="Search…"
              placeholderTextColor="#888"
              style={styles.searchInput}
            />
          </View>
        </View>
      </View>

      <FlatList
        data={data}
        renderItem={renderItem}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
        numColumns={numColumns}
        columnWrapperStyle={{
          justifyContent: "space-between",
          marginBottom: GAP,
        }}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
        initialNumToRender={12}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loadingWrap: {
    flex: 1,
    backgroundColor: "black",
    alignItems: "center",
    justifyContent: "center",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  title: { color: "white", fontSize: 22, fontWeight: "700" },
  searchInput: {
    width: "100%",
    height: 36,
    borderRadius: 8,
    paddingHorizontal: 10,
    backgroundColor: "#222",
    color: "#fff",
  },
});
