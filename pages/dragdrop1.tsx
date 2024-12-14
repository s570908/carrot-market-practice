import React, { useState, useEffect, useId } from "react";
import Image from "next/image";
import {
  DndContext,
  closestCenter,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  horizontalListSortingStrategy,
  SortableContext,
  arrayMove,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";

interface ImageType {
  id: string;
  src: string;
}

const SortableItem: React.FC<{ id: string; children: React.ReactNode }> = ({
  id,
  children,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
  });

  const style = {
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
    transition,
    zIndex: isDragging ? 1000 : "auto",
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="inline-block"
    >
      {children}
    </div>
  );
};

const ImageSlider: React.FC = () => {
  const [isDragEnabled, setIsDragEnabled] = useState(true); // 드래그 모드 상태
  const imageUrls = [
    "https://picsum.photos/id/1011/400/300",
    "https://picsum.photos/id/1012/400/300",
    "https://picsum.photos/id/1013/400/300",
  ];

  const [images, setImages] = useState<ImageType[]>(
    imageUrls.map((url, index) => ({
      id: `image-${index}`,
      src: url,
    }))
  );

  const [newImageUrl, setNewImageUrl] = useState("");
  const [describedById, setDescribedById] = useState<string | null>(null);

  const handleRemove = (id: string): void => {
    setImages((prev) => prev.filter((image) => image.id !== id));
  };

  const handleAdd = (): void => {
    if (newImageUrl.trim() === "") return;
    setImages((prev) => [
      ...prev,
      { id: `image-${prev.length}`, src: newImageUrl.trim() },
    ]);
    setNewImageUrl("");
  };

  const handleDragEnd = (event: any): void => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    setImages((prev) => {
      const oldIndex = prev.findIndex((item) => item.id === active.id);
      const newIndex = prev.findIndex((item) => item.id === over.id);

      return arrayMove(prev, oldIndex, newIndex);
    });
  };

  const sensors = useSensors(useSensor(MouseSensor), useSensor(TouchSensor));

  return (
    <div className="mx-auto mt-8 w-4/5">
      <div className="mb-4 flex gap-2">
        <input
          type="text"
          value={newImageUrl}
          onChange={(e) => setNewImageUrl(e.target.value)}
          placeholder="Add new image URL"
          className="flex-grow rounded border p-2"
        />
        <button
          onClick={handleAdd}
          className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
        >
          Add
        </button>
        <button
          onClick={() => setIsDragEnabled((prev) => !prev)} // 드래그 모드 토글
          className="rounded bg-gray-500 px-4 py-2 text-white hover:bg-gray-600"
        >
          {isDragEnabled ? "Disable Drag" : "Enable Drag"}
        </button>
      </div>

      <DndContext
        collisionDetection={closestCenter}
        onDragEnd={isDragEnabled ? handleDragEnd : undefined} // 드래그 모드에 따라 이벤트 처리
        sensors={isDragEnabled ? sensors : []} // 드래그 모드에 따라 센서 처리
      >
        <SortableContext
          items={images.map((image) => image.id)}
          strategy={horizontalListSortingStrategy}
        >
          <div className="flex gap-4 overflow-x-auto">
            {images.map((image) =>
              isDragEnabled ? (
                <SortableItem key={image.id} id={image.id}>
                  <div className="relative">
                    <Image
                      src={image.src}
                      alt={`Image ${image.id}`}
                      width={200}
                      height={150}
                      className="rounded-lg object-cover shadow-lg"
                    />
                    <button
                      onClick={() => handleRemove(image.id)}
                      className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-sm text-white transition hover:bg-red-600"
                    >
                      ⓧ
                    </button>
                  </div>
                </SortableItem>
              ) : (
                <div key={image.id} className="relative">
                  <Image
                    src={image.src}
                    alt={`Image ${image.id}`}
                    width={200}
                    height={150}
                    className="rounded-lg object-cover shadow-lg"
                  />
                  <button
                    onClick={() => handleRemove(image.id)}
                    className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-sm text-white transition hover:bg-red-600"
                  >
                    ⓧ
                  </button>
                </div>
              )
            )}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
};

export default ImageSlider;
