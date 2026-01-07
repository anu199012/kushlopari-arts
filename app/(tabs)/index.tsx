import { useRouter } from "expo-router";
import { collection, getDocs } from "firebase/firestore";
import React, { useEffect, useMemo, useRef, useState } from "react";
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

console.log("Connected projectId:", db.app.options.projectId);

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
        return;
      }
    } catch { }
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

        // use imageUrl directly for cards
        const resolved = list.map((item) => ({
          ...item,
          thumbnailImage: item.imageUrl || null,
        }));

        // init float animation values
        resolved.forEach((item) => {
          if (!floatAnims.has(item.id)) {
            floatAnims.set(item.id, new Animated.ValueXY({ x: 0, y: 0 }));
          }
        });

        setData(resolved);
      } catch (err) {
        console.warn("fetch categories error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, []);
  // =================================

  // ===== SORTED DATA (Matches First) =====
  const sortedData = useMemo(() => {
    if (!searchText.trim()) return data;

    const lower = searchText.toLowerCase();
    const matches: any[] = [];
    const others: any[] = [];

    data.forEach((item) => {
      const name =
        item.name ?? item.title ?? item.categoryName ?? String(item.id);
      if (name.toLowerCase().includes(lower)) {
        matches.push(item);
      } else {
        others.push(item);
      }
    });

    return [...matches, ...others];
  }, [data, searchText]);
  // =======================================

  // ===== FLOATING ANIMATION =====
  useEffect(() => {
    if (!data.length) return;
    // Animation only pauses on Hover, continues during Search
    if (hoveredId) return;

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
  }, [data, hoveredId]); // Removed searchText from dependency
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
      (searchText &&
        name.toLowerCase().includes(searchText.toLowerCase()));

    return (
      <Animated.View
        style={[
          floatAnim
            ? { transform: floatAnim.getTranslateTransform() }
            : undefined,
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
            // height: cardHeight, // Let height be determined by content
            backgroundColor: "#111",
            borderRadius: 12,
            overflow: "hidden",
            borderColor: active ? "#fff" : "transparent",
            borderWidth: 1,
            paddingBottom: 8, // Add some bottom padding for the text
          }}
        >
          {item.thumbnailImage && (
            <Image
              source={{ uri: item.thumbnailImage }}
              style={{ width: "100%", height: cardHeight }} // Use fixed height for image
              resizeMode="cover"
            />
          )}

          <View
            style={{
              paddingHorizontal: 8,
              marginTop: 8,
            }}
          >
            <Text
              style={{ color: "white", fontSize: 13, fontWeight: "600" }}
              numberOfLines={2}
            >
              {name}
            </Text>
          </View>
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
        style={{ flex: 1 }}
        data={sortedData}
        renderItem={renderItem}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
        numColumns={numColumns}
        columnWrapperStyle={{
          justifyContent: "space-between",
          marginBottom: GAP,
        }}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews
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
