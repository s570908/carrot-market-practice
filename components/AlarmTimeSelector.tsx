import React, { useEffect } from 'react';
import { validatealarmTime } from '@/libs/utils';

interface AlarmTimeSelectorProps {
  value: string;
  onChange: (time: string) => void;
  appointmentTime: Date;
}

const AlarmTimeSelector: React.FC<AlarmTimeSelectorProps> = ({ 
  value, 
  onChange, 
  appointmentTime 
}) => {
  const baseAlertOptions = [
    { label: "30분 전", value: "30분 전" },
    { label: "10분 전", value: "10분 전" },
    { label: "1시간 전", value: "1시간 전" },
    { label: "1일 전", value: "1일 전" },
    { label: "알림 없이 생성", value: "알림 없이 생성" },
  ];

  // 날짜와 시간이 모두 선택되었는지 확인
  const isDateTimeSelected = !isNaN(appointmentTime.getTime());

  // 각 옵션의 유효성을 검사하고 유효한 것부터 정렬
  const sortedOptions = baseAlertOptions
    .map(option => {
      if (option.value === "알림 없이 생성") {
        return { ...option, disabled: false, warning: false, isValid: true };
      }
      const { isValid, timeDiffInMinutes } = validatealarmTime(appointmentTime, option.value);
      return {
        ...option,
        disabled: isDateTimeSelected ? !isValid : false,
        warning: isDateTimeSelected && timeDiffInMinutes < 30 && isValid,
        isValid
      };
    })
    .sort((a, b) => {
      // 유효한 옵션을 먼저 정렬
      if (a.isValid && !b.isValid) return -1;
      if (!a.isValid && b.isValid) return 1;
      return 0;
    });

  // 현재 선택된 값이 무효하면 첫 번째 유효한 옵션으로 자동 변경
  useEffect(() => {
    if (isDateTimeSelected) {
      const currentOption = sortedOptions.find(opt => opt.value === value);
      if (currentOption?.disabled) {
        const firstValidOption = sortedOptions.find(opt => !opt.disabled);
        if (firstValidOption) {
          onChange(firstValidOption.value);
        }
      }
    }
  }, [isDateTimeSelected, onChange, sortedOptions, value]);

  // "알림 없이 생성"을 제외한 옵션 중 하나라도 enabled라면 안내 메시지 표시하지 않음
  const allExceptNoneDisabled = isDateTimeSelected &&
    sortedOptions
      .filter(opt => opt.value !== "알림 없이 생성")
      .every(opt => opt.disabled);

  return (
    <div className="flex flex-col space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-medium text-gray-700">약속 알림</span>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-2/3 px-3 py-2 text-gray-700 border border-gray-300 rounded-md focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
          title="알림 시간을 선택하세요"
        >
          <option value="" disabled hidden className="text-gray-500">
            알림 시간을 선택하세요
          </option>
          {sortedOptions.map((option) => (
            <option 
              key={option.value} 
              value={option.value}
              disabled={option.disabled}
              className={`
                ${option.disabled 
                  ? 'text-gray-300 bg-gray-50' 
                  : 'text-gray-900 font-medium bg-white hover:bg-orange-50'
                }
                ${option.warning ? 'text-orange-600 font-semibold' : ''}
              `}
              style={{
                fontWeight: option.disabled ? 'normal' : '500',
                opacity: option.disabled ? 0.4 : 1
              }}
            >
              {option.label}
              {option.warning ? ' (임박!)' : ''}
              {option.disabled ? ' 선택불가' : ''}
            </option>
          ))}
        </select>
      </div>
      {/* 더 명확한 안내 메시지 */}
      {allExceptNoneDisabled && (
        <div className="p-3 text-sm border rounded-lg text-amber-700 bg-amber-50 border-amber-200">
          <div className="flex items-center gap-2">
            <span className="text-amber-600">⚠️</span>
            <span>선택한 시간으로는 알림 설정이 불가능하여 <strong>알림 없이 생성</strong>됩니다.</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default AlarmTimeSelector;
