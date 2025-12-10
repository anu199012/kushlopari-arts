// app/category/[id].tsx
import { useLocalSearchParams, useRouter } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import { getDownloadURL, getStorage, ref } from "firebase/storage";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Image,
    Pressable,
    ScrollView,
    Text,
    View,
} from "react-native";
import { db } from "../../src/firebaseConfig";

export default function CategoryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const storage = getStorage();

  const [category, setCategory] = useState<any | null>(null);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!id) return;

    let isMounted = true;

    const fetchCategory = async () => {
      try {
        const docRef = doc(db, "categories", String(id));
        const snap = await getDoc(docRef);

        if (!snap.exists()) {
          console.warn("Category not found");
          if (isMounted) {
            setCategory(null);
            setImageUrls([]);
          }
          return;
        }

        const data = snap.data();
        if (!isMounted) return;

        setCategory({ id: snap.id, ...data });

        // ----- Build images array -----
        const rawImages = data.images;
        let imagesArray: string[] =
          Array.isArray(rawImages)
            ? rawImages
                .map((it: any) =>
                  typeof it === "string"
                    ? it
                    : it?.url ?? it?.downloadURL ?? it?.path ?? null
                )
                .filter(Boolean)
            : typeof rawImages === "string" && rawImages.includes(",")
            ? rawImages
                .split(",")
                .map((p: string) => p.trim())
                .filter(Boolean)
            : typeof rawImages === "string" && rawImages.length
            ? [rawImages]
            : [];

        // If images field is empty, fall back to imageUrl
        if ((!imagesArray || imagesArray.length === 0) && data.imageUrl) {
          imagesArray = [data.imageUrl];
        }

        // ----- Resolve URLs (gs:// or paths → downloadURL) -----
        const resolved = await Promise.all(
          imagesArray.map(async (candidate: string) => {
            if (!candidate) return null;

            if (
              candidate.startsWith("gs://") ||
              !/^https?:\/\//i.test(candidate)
            ) {
              try {
                return await getDownloadURL(ref(storage, candidate));
              } catch {
                const stripped = candidate.replace(/^gs:\/\/[^/]+\//i, "");
                try {
                  return await getDownloadURL(ref(storage, stripped));
                } catch {
                  return null;
                }
              }
            } else {
              // already full https URL
              return candidate;
            }
          })
        );

        const filtered = resolved.filter(Boolean) as string[];

        if (isMounted) {
          setImageUrls(filtered);
          setCurrentIndex(0);
        }
      } catch (err) {
        console.error("Error loading category detail", err);
        if (isMounted) {
          setCategory(null);
          setImageUrls([]);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchCategory();

    return () => {
      isMounted = false;
    };
  }, [id, storage]);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : prev));
  };

  const handleNext = () => {
    setCurrentIndex((prev) =>
      prev < imageUrls.length - 1 ? prev + 1 : prev
    );
  };

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "black",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator size="large" color="white" />
        <Text style={{ color: "white", marginTop: 10 }}>Loading…</Text>
      </View>
    );
  }

  if (!category) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "black",
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 20,
        }}
      >
        <Text style={{ color: "white", fontSize: 16, marginBottom: 12 }}>
          Category not found.
        </Text>
        <Pressable
          onPress={() => router.back()}
          style={{
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: "white",
          }}
        >
          <Text style={{ color: "white" }}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const name =
    category.name ??
    category.title ??
    category.categoryName ??
    category.label ??
    "";

  const description =
    category.description ??
    category.details ??
    category.caption ??
    "";

  const currentImage =
    imageUrls.length > 0 ? imageUrls[currentIndex] : null;

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "black",
        paddingTop: 40,
      }}
    >
      {/* Top title - sticky */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingBottom: 10,
        }}
      >
        <Text
          style={{
            color: "white",
            fontSize: 20,
            fontWeight: "700",
            marginBottom: 4,
          }}
          numberOfLines={2}
          ellipsizeMode="tail"
        >
          {name}
        </Text>

        {imageUrls.length > 1 && (
          <Text style={{ color: "#aaa", fontSize: 12 }}>
            {currentIndex + 1} / {imageUrls.length}
          </Text>
        )}
      </View>

      {/* Middle: image area with arrows – only this part changes */}
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 16,
        }}
      >
        {currentImage ? (
          <View
            style={{
              width: "100%",
              aspectRatio: 3 / 4,
              maxHeight: "100%",
              borderRadius: 12,
              overflow: "hidden",
              position: "relative",
              backgroundColor: "#111",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Image
              source={{ uri: currentImage }}
              style={{ width: "100%", height: "100%" }}
              resizeMode="contain"
            />

            {/* Left Arrow */}
            {imageUrls.length > 1 && (
              <>
                <Pressable
                  onPress={handlePrev}
                  disabled={currentIndex === 0}
                  style={{
                    position: "absolute",
                    left: 10,
                    top: "50%",
                    transform: [{ translateY: -18 }],
                    padding: 8,
                    backgroundColor: "rgba(0,0,0,0.6)",
                    borderRadius: 20,
                    opacity: currentIndex === 0 ? 0.3 : 1,
                  }}
                >
                  <Text
                    style={{ color: "white", fontSize: 22, fontWeight: "700" }}
                  >
                    ‹
                  </Text>
                </Pressable>

                {/* Right Arrow */}
                <Pressable
                  onPress={handleNext}
                  disabled={currentIndex === imageUrls.length - 1}
                  style={{
                    position: "absolute",
                    right: 10,
                    top: "50%",
                    transform: [{ translateY: -18 }],
                    padding: 8,
                    backgroundColor: "rgba(0,0,0,0.6)",
                    borderRadius: 20,
                    opacity:
                      currentIndex === imageUrls.length - 1 ? 0.3 : 1,
                  }}
                >
                  <Text
                    style={{ color: "white", fontSize: 22, fontWeight: "700" }}
                  >
                    ›
                  </Text>
                </Pressable>
              </>
            )}
          </View>
        ) : (
          <Text style={{ color: "white" }}>No images available</Text>
        )}
      </View>

      {/* Bottom description - sticky */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingVertical: 16,
          borderTopWidth: 1,
          borderTopColor: "#222",
        }}
      >
        <ScrollView
          style={{ maxHeight: 120 }}
          bounces={false}
          showsVerticalScrollIndicator={true}
        >
          <Text
            style={{
              color: "#ddd",
              fontSize: 14,
              lineHeight: 20,
            }}
          >
            {description || "No description available."}
          </Text>
        </ScrollView>
      </View>
    </View>
  );
}
