import React, { useState, ChangeEvent } from "react";
import Image from "next/image";
import axios from "axios";

interface Image {
  id: number;
  largeImageURL?: string;
  tags: string;
  urls?: {
    regular: string;
  };
  alt_description?: string;
}

const PixabayApiKey = "48759146-983faf87d60a1f16ffdd2f03e";
const UnsplashAccessKey = "a7RZy_pctwpIXQ9U-U_y6Z0kjzTdlxKA3t82OC_ff6A";
const UnsplashSecretKey = "AYins8lRQQBt5J0pJc-koZMQ24P_x7gs_fztrrC8dgI";
const UnsplashApplicationID = "708710";

const ImageFetcher = () => {
  const [query, setQuery] = useState<string>(""); // 검색어 상태
  const [count, setCount] = useState<number>(1);
  const [images, setImages] = useState<Image[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [subDirName, setSubDirName] = useState<string>("Pictures/dev/carrot-market"); // 서브디렉토리 이름 상태
  const [filePath, setFilePath] = useState<string | null>(null); // 저장된 파일 경로 상태
  const [apiSource, setApiSource] = useState<string>("pixabay"); // API 소스 상태

  const fetchImages = async () => {
    try {
      setLoading(true);
      let response;
      if (apiSource === "pixabay") {
        response = await axios.get(
          `https://pixabay.com/api/?key=${PixabayApiKey}&q=${query}&per_page=${count}`
        );
        if (response && response.data) {
          setImages(response.data.hits);
        } else {
          setError("No data found");
        }
      } else if (apiSource === "unsplash") {
        response = await axios.get(
          `https://api.unsplash.com/search/photos?query=${query}&per_page=${count}`,
          {
            headers: {
              Authorization: `Client-ID ${UnsplashAccessKey}`,
              "Content-Type": "application/json",
            },
          }
        );
        if (response && response.data) {
          setImages(response.data.results);
        } else {
          setError("No data found");
        }
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.message);
      } else {
        setError("An unknown error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSaveImages = () => {
    images.forEach((image, index) => {
      const imageUrl = apiSource === "pixabay" ? image.largeImageURL : image.urls?.regular;
      if (imageUrl) {
        axios.get(imageUrl, { responseType: "blob" }).then((response) => {
          const fileReader = new FileReader();
          fileReader.readAsDataURL(response.data);
          fileReader.onload = () => {
            const base64data = fileReader.result as string;
            const fileName = `image_${Date.now()}_${index + 1}.jpg`;
            axios
              .post("/api/saveImage", {
                base64data: base64data.split(",")[1],
                subDirName,
                filename: fileName,
              })
              .then((res) => {
                console.log("Image saved successfully!");
                setFilePath(res.data.filePath);
              })
              .catch((error) => {
                console.error("Error saving image:", error);
              });
          };
        });
      }
    });
  };

  return (
    <div className="p-5 text-center">
      <h1 className="mb-5 text-2xl font-bold">Random Image Fetcher</h1>
      <div className="mb-5">
        <label className="mb-2 block">
          API Source:
          <select
            value={apiSource}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => setApiSource(e.target.value)}
            className="ml-2 w-48 rounded border p-2"
          >
            <option value="pixabay">Pixabay</option>
            <option value="unsplash">Unsplash</option>
          </select>
        </label>
        <label className="mb-2 block">
          Query:
          <input
            type="text"
            value={query}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
            placeholder="Enter search query"
            className="ml-2 rounded border p-2"
          />
        </label>
        <label className="mb-2 block">
          Count:
          <input
            type="number"
            value={count}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setCount(Number(e.target.value))}
            min="1"
            max="200"
            className="ml-2 rounded border p-2"
          />
        </label>
        <label className="mb-2 block">
          Enter subdirectory name:
          <input
            type="text"
            placeholder="Enter subdirectory name"
            value={subDirName}
            onChange={(e) => setSubDirName(e.target.value)}
            className="ml-2 w-60 rounded border p-2"
          />
        </label>
        <button
          onClick={fetchImages}
          className="mr-2 rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-700"
        >
          Fetch Images
        </button>
        <button
          onClick={handleSaveImages}
          className="rounded bg-green-500 px-4 py-2 text-white hover:bg-green-700"
        >
          Save Images
        </button>
      </div>
      {loading && <p>Loading...</p>}
      {error && <p>Error: {error}</p>}
      {filePath && <p>File saved at: {filePath}</p>}
      <div className="flex flex-wrap justify-center">
        {images.map((image) => (
          <div key={image.id} className="m-2">
            <Image
              src={
                apiSource === "pixabay"
                  ? image.largeImageURL || "/default-image.jpg"
                  : image.urls?.regular || "/default-image.jpg"
              }
              alt={image.alt_description || "Image"}
              width={500}
              height={300}
              className="h-auto w-full rounded shadow"
            />
            <p>{image.alt_description || "No description"}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ImageFetcher;
