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
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppHeader } from "@/components/app-header";
import { db } from "../../src/firebaseConfig";
import {
  normalizeCategoryData,
  pickDisplayName,
} from "../../src/categoryFields";

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

/** Preferred home-page module order (1-based display). Firestore `order` overrides this if set. */
const MODULE_ORDER = [
  "Rough Sketching",
  "Realistic Pencil Potrait",
  "Blood Art",
  "WaterColor Art",
  "Caricature Pencil Art",
  "Pet Potrait",
  "Oil's on canvas painting",
  "Oil's on wood plank",
  "Pencil on wood Plank",
  "MarkerDot Art",
  "NailString Art",
  "String Art",
];

const normalizeName = (value: unknown) =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

const MODULE_ORDER_INDEX = new Map(
  MODULE_ORDER.map((name, index) => [normalizeName(name), index + 1])
);

const getModuleSortKey = (item: any) => {
  if (typeof item.order === "number") return item.order;
  const name = normalizeName(
    item.name ?? item.title ?? item.categoryName ?? item.label ?? item.id
  );
  const id = normalizeName(item.id);
  return (
    MODULE_ORDER_INDEX.get(name) ??
    MODULE_ORDER_INDEX.get(id) ??
    Number.MAX_SAFE_INTEGER
  );
};

export default function HomeScreen() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const router = useRouter();
  const { width } = useWindowDimensions();
  const searchRef = useRef<TextInput>(null);

  const floatAnims = useRef(new Map<string, Animated.ValueXY>()).current;

  const getItemName = (item: any) => pickDisplayName(item, String(item.id));

  // ========== FETCH DATA ==========
  useEffect(() => {
    const fetch = async () => {
      try {
        const snap = await getDocs(collection(db, "categories"));
        const list: any[] = [];
        snap.forEach((d) =>
          list.push(normalizeCategoryData(d.id, d.data() as Record<string, unknown>))
        );

        // use imageUrl directly for cards; sort by Firestore `order` or MODULE_ORDER
        const resolved = list
          .map((item) => ({
            ...item,
            thumbnailImage: item.imageUrl || null,
          }))
          .sort((a, b) => {
            const ao = getModuleSortKey(a);
            const bo = getModuleSortKey(b);
            if (ao !== bo) return ao - bo;
            const an = pickDisplayName(a, String(a.id));
            const bn = pickDisplayName(b, String(b.id));
            return an.localeCompare(bn);
          });

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
      const name = getItemName(item);
      if (name.toLowerCase().includes(lower)) {
        matches.push(item);
      } else {
        others.push(item);
      }
    });

    return [...matches, ...others];
  }, [data, searchText]);

  const suggestions = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    if (!q) return [];
    return data
      .map((item) => ({ id: String(item.id), name: getItemName(item) }))
      .filter((item) => item.name.toLowerCase().includes(q))
      .slice(0, 8);
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

    const name = getItemName(item);

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

  const selectSuggestion = (item: { id: string; name: string }) => {
    setSearchText("");
    setShowSuggestions(false);
    searchRef.current?.blur();
    Keyboard.dismiss();
    router.push({
      pathname: "/category/[id]",
      params: { id: item.id },
    });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "black" }}>
      <View style={{ paddingHorizontal: 16, paddingTop: 12, zIndex: 20 }}>
        <AppHeader
          right={
            <View style={styles.searchWrap}>
              <TextInput
                ref={searchRef}
                value={searchText}
                onChangeText={(text) => {
                  setSearchText(text);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => {
                  // Allow suggestion press to register before hiding
                  setTimeout(() => setShowSuggestions(false), 150);
                }}
                placeholder="Search…"
                placeholderTextColor="#888"
                style={styles.searchInput}
                returnKeyType="search"
                autoCorrect={false}
                autoCapitalize="none"
              />
              {showSuggestions && suggestions.length > 0 ? (
                <View style={styles.suggestions}>
                  {suggestions.map((item) => (
                    <Pressable
                      key={item.id}
                      onPress={() => selectSuggestion(item)}
                      style={({ pressed }) => [
                        styles.suggestionRow,
                        pressed && styles.suggestionPressed,
                      ]}
                    >
                      <Text style={styles.suggestionText} numberOfLines={1}>
                        {item.name}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              ) : null}
            </View>
          }
        />
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
        keyboardShouldPersistTaps="handled"
        onScrollBeginDrag={() => {
          searchRef.current?.blur();
          Keyboard.dismiss();
          setShowSuggestions(false);
        }}
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
  searchWrap: {
    width: "100%",
    position: "relative",
    zIndex: 30,
  },
  searchInput: {
    width: "100%",
    height: 36,
    borderRadius: 8,
    paddingHorizontal: 10,
    backgroundColor: "#222",
    color: "#fff",
  },
  suggestions: {
    position: "absolute",
    top: 40,
    left: 0,
    right: 0,
    backgroundColor: "#1a1a1a",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#333",
    overflow: "hidden",
    maxHeight: 240,
    zIndex: 40,
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  suggestionRow: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#333",
  },
  suggestionPressed: {
    backgroundColor: "#2a2a2a",
  },
  suggestionText: {
    color: "#fff",
    fontSize: 14,
  },
});
