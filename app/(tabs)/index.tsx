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
  Pressable,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { db } from "../../src/firebaseConfig";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const HORIZONTAL_PADDING = 16 * 2;
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

  // ✅ Gentle motion refs per card
  const floatAnims = useRef(new Map<string, Animated.ValueXY>()).current;

  // ✅ Fetch data
  useEffect(() => {
    const fetch = async () => {
      const snap = await getDocs(collection(db, "categories"));
      const list: any[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() }));

      const resolved = await Promise.all(
        list.map(async (item) => {
          if (!item.imageUrl) return item;
          try {
            const url =
              item.imageUrl.startsWith("http")
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

      // init gentle motion for each card
      resolved.forEach((item, index) => {
        if (!floatAnims.has(item.id)) {
          floatAnims.set(item.id, new Animated.ValueXY({ x: 0, y: 0 }));
        }
      });

      setData(resolved);
      setLoading(false);
    };

    fetch();
  }, [storage]);

  // ✅ Gentle floating animation (illusion of life)
  useEffect(() => {
    if (!data.length) return;
    if (hoveredId || searchText.trim()) return;

    const animations: Animated.CompositeAnimation[] = [];

    data.forEach((item, index) => {
      const anim = floatAnims.get(item.id);
      if (!anim) return;

      // tiny varied movement
      const dx = ((index % 3) - 1) * 4; // -4, 0, +4
      const dy = ((index % 4) - 1.5) * 4;

      animations.push(
        Animated.loop(
          Animated.sequence([
            Animated.timing(anim, {
              toValue: { x: dx, y: dy },
              duration: 7000,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(anim, {
              toValue: { x: 0, y: 0 },
              duration: 7000,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
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

  const computeNumColumns = () => {
    const available =
      Math.max(width, SCREEN_WIDTH) - HORIZONTAL_PADDING;
    const ideal = Math.floor(available / (MIN_CARD_WIDTH + GAP));
    return Math.min(Math.max(ideal, 4), MAX_COLUMNS);
  };

  const numColumns = computeNumColumns();

  const cardWidth = Math.floor(
    (width - HORIZONTAL_PADDING - GAP * (numColumns - 1)) / numColumns
  );
  const cardHeight = Math.round(cardWidth * 1.25);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: "black", alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color="white" />
      </View>
    );
  }

  const renderItem = ({ item }: { item: any }) => {
    const floatAnim = floatAnims.get(item.id);

    const name =
      item.name ?? item.title ?? item.categoryName ?? String(item.id);

    const active =
      hoveredId === String(item.id) ||
      (searchText && name.toLowerCase().includes(searchText.toLowerCase()));

    return (
      <Animated.View
        style={{
          transform: floatAnim
            ? floatAnim.getTranslateTransform()
            : undefined,
        }}
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
    <View style={{ flex: 1, backgroundColor: "black", paddingTop: 32, paddingHorizontal: 16 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 12 }}>
        <Text style={{ color: "white", fontSize: 22, fontWeight: "700" }}>
          Kushlopari Arts 🎨
        </Text>
        <TextInput
          value={searchText}
          onChangeText={setSearchText}
          placeholder="Search…"
          placeholderTextColor="#888"
          style={{
            width: 180,
            height: 34,
            borderRadius: 8,
            paddingHorizontal: 10,
            backgroundColor: "#222",
            color: "#fff",
          }}
        />
      </View>

      <FlatList
        data={data}
        renderItem={renderItem}
        keyExtractor={(item) => String(item.id)}
        numColumns={numColumns}
        columnWrapperStyle={{ justifyContent: "space-between", marginBottom: GAP }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}
