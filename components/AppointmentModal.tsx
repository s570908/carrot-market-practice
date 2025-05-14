import { ModalAPI } from "@libs/client/useAwaitableModal";
import MapViewer from "@components/MapViewer";
import dayjs from "dayjs";
import 'dayjs/locale/ko';

interface AppointmentModalProps {
  modal: ModalAPI;
  params: {
    appointmentTime: string;
    place: string;
    latitude: number;
    longitude: number;
  };
}

export default function AppointmentModal({ modal, params }: AppointmentModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="fixed inset-0 bg-black opacity-50" 
        onClick={() => modal.closeWithResult(null)} 
      />
      <div className="relative z-10 p-6 bg-white rounded-lg shadow-xl w-[32rem]">
        <h2 className="mb-4 text-xl font-bold">약속 정보</h2>

        <div className="flex items-center mb-1 space-x-4">
          <label className="text-sm font-medium text-gray-700 w-14">날짜</label>
          <div className="flex-1 p-2 bg-gray-100 rounded-md">
            {dayjs(params.appointmentTime).locale('ko').format("M월 D일 (ddd)")}
          </div>
        </div>

        <div className="flex items-center mb-1 space-x-4">
          <label className="text-sm font-medium text-gray-700 w-14">시간</label>
          <div className="flex-1 p-2 bg-gray-100 rounded-md">
            {dayjs(params.appointmentTime).locale('ko').format("A h:mm")}
          </div>
        </div>

        <div className="flex items-center mb-1 space-x-4">
          <label className="text-sm font-medium text-gray-700 w-14">장소</label>
          <div className="flex-1 p-2 bg-gray-100 rounded-md">
            {params.place}
          </div>
        </div>

        <div className="w-full mt-4 overflow-hidden rounded-lg shadow-md">
          <MapViewer
            lat={params.latitude}
            lng={params.longitude}
            height="500px"
            width="100%"
            zoomLevel={15}
            name={params.place}
            containerClassName="w-full"
          />
        </div>

        <button
          onClick={() => modal.closeWithResult(null)}
          className="w-full py-2 mt-4 font-medium text-white bg-orange-500 rounded-md hover:bg-orange-600"
        >
          완료
        </button>
      </div>
    </div>
  );
}
