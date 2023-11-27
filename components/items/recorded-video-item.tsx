import Separator from "@components/separator";
import CreatedAt from "@components/created-at";

interface RecordedVideoItemProps {
  preview: string;
  meta: { name: string };
  duration: number;
  created: string;
}

const RecordedVideoItem = ({ preview, meta, duration, created }: RecordedVideoItemProps) => {
  return (
    <div className="aspect-video w-full rounded-lg">
      <iframe
        src={preview}
        allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
        allowFullScreen={true}
        className="h-full w-full rounded-lg shadow-lg"
      ></iframe>
      <div>
        <h2 className="mt-2 text-base font-medium">{meta?.name}</h2>
        <div className="flex items-center">
          <p className="mr-0.5 text-sm">
            {new Date(Math.ceil(duration) * 1000).toTimeString().substring(3, 8)}
          </p>
          <Separator />
          <CreatedAt date={created} size="text-[13px] ml-0.5" />
        </div>
      </div>
    </div>
  );
};

export default RecordedVideoItem;
