import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { getAllReleases, createRelease, updateRelease, deleteRelease } from "@apiLibs/appReleases";
import type { AppRelease } from "@apiLibs/appReleases";

export default function AdminReleases() {
  const [formData, setFormData] = useState({
    version: "",
    buildId: "",
    forceUpdate: false,
    message: ""
  });
  const [editingId, setEditingId] = useState<number | null>(null);

  // 버전 목록 조회
  const { data: releasesData, refetch } = useQuery({
    queryKey: ["appReleases"],
    queryFn: () => getAllReleases()
  });

  const releases = releasesData?.data || [];

  // 새 버전 생성
  const { mutate: create, isPending: isCreating } = useMutation({
    mutationFn: () => createRelease(formData),
    onSuccess: () => {
      alert("버전이 추가되었습니다");
      setFormData({ version: "", buildId: "", forceUpdate: false, message: "" });
      refetch();
    },
    onError: (error: any) => {
      alert(`오류: ${error.response?.data?.error || "버전 추가 실패"}`);
    }
  });

  // 버전 수정
  const { mutate: update, isPending: isUpdating } = useMutation({
    mutationFn: () => {
      if (!editingId) throw new Error("ID가 필요합니다");
      return updateRelease(editingId, formData);
    },
    onSuccess: () => {
      alert("버전이 수정되었습니다");
      setFormData({ version: "", buildId: "", forceUpdate: false, message: "" });
      setEditingId(null);
      refetch();
    },
    onError: (error: any) => {
      alert(`오류: ${error.response?.data?.error || "버전 수정 실패"}`);
    }
  });

  // 버전 삭제
  const { mutate: remove, isPending: isDeleting } = useMutation({
    mutationFn: (id: number) => deleteRelease(id),
    onSuccess: () => {
      alert("버전이 삭제되었습니다");
      refetch();
    },
    onError: (error: any) => {
      alert(`오류: ${error.response?.data?.error || "버전 삭제 실패"}`);
    }
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, type, value } = e.target as HTMLInputElement;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value
    });
  };

  const handleEdit = (release: AppRelease) => {
    setEditingId(release.id);
    setFormData({
      version: release.version,
      buildId: release.buildId,
      forceUpdate: release.forceUpdate,
      message: release.message || ""
    });
  };

  const handleCancel = () => {
    setFormData({ version: "", buildId: "", forceUpdate: false, message: "" });
    setEditingId(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      update();
    } else {
      create();
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
      <h1>📱 앱 버전 관리</h1>

      {/* 폼 섹션 */}
      <div style={{ marginBottom: "30px", padding: "20px", border: "1px solid #ddd", borderRadius: "8px" }}>
        <h2>{editingId ? "버전 수정" : "새 버전 추가"}</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "15px" }}>
            <label>
              버전 (예: 1.0.0) <span style={{ color: "red" }}>*</span>
            </label>
            <input
              type="text"
              name="version"
              value={formData.version}
              onChange={handleInputChange}
              placeholder="1.0.0"
              disabled={editingId !== null}
              required
              style={{ width: "100%", padding: "8px", marginTop: "5px" }}
            />
          </div>

          <div style={{ marginBottom: "15px" }}>
            <label>
              빌드 ID (예: 2026.05.16-01) <span style={{ color: "red" }}>*</span>
            </label>
            <input
              type="text"
              name="buildId"
              value={formData.buildId}
              onChange={handleInputChange}
              placeholder="2026.05.16-01"
              required
              style={{ width: "100%", padding: "8px", marginTop: "5px" }}
            />
          </div>

          <div style={{ marginBottom: "15px" }}>
            <label>
              <input
                type="checkbox"
                name="forceUpdate"
                checked={formData.forceUpdate}
                onChange={handleInputChange}
              />
              {" "}강제 업데이트 (체크하면 앱 진입 차단)
            </label>
          </div>

          <div style={{ marginBottom: "15px" }}>
            <label>설명 메시지</label>
            <textarea
              name="message"
              value={formData.message}
              onChange={handleInputChange}
              placeholder="사용자에게 보여줄 메시지"
              style={{ width: "100%", padding: "8px", marginTop: "5px", height: "100px" }}
            />
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <button
              type="submit"
              disabled={isCreating || isUpdating}
              style={{
                padding: "10px 20px",
                backgroundColor: "#4CAF50",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: isCreating || isUpdating ? "not-allowed" : "pointer"
              }}
            >
              {isCreating || isUpdating ? "처리중..." : editingId ? "수정" : "추가"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={handleCancel}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#666",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer"
                }}
              >
                취소
              </button>
            )}
          </div>
        </form>
      </div>

      {/* 버전 목록 섹션 */}
      <div>
        <h2>배포된 버전 목록</h2>
        {releases.length === 0 ? (
          <p>버전 정보가 없습니다.</p>
        ) : (
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              marginTop: "15px"
            }}
          >
            <thead>
              <tr style={{ backgroundColor: "#f0f0f0" }}>
                <th style={{ padding: "10px", textAlign: "left", borderBottom: "2px solid #ddd" }}>
                  버전
                </th>
                <th style={{ padding: "10px", textAlign: "left", borderBottom: "2px solid #ddd" }}>
                  빌드 ID
                </th>
                <th style={{ padding: "10px", textAlign: "center", borderBottom: "2px solid #ddd" }}>
                  강제 업데이트
                </th>
                <th style={{ padding: "10px", textAlign: "left", borderBottom: "2px solid #ddd" }}>
                  배포 시간
                </th>
                <th style={{ padding: "10px", textAlign: "center", borderBottom: "2px solid #ddd" }}>
                  작업
                </th>
              </tr>
            </thead>
            <tbody>
              {releases.map((release) => (
                <tr key={release.id} style={{ borderBottom: "1px solid #ddd" }}>
                  <td style={{ padding: "10px" }}>
                    <strong>{release.version}</strong>
                  </td>
                  <td style={{ padding: "10px" }}>{release.buildId}</td>
                  <td style={{ padding: "10px", textAlign: "center" }}>
                    {release.forceUpdate ? (
                      <span style={{ color: "red", fontWeight: "bold" }}>⚠️ 강제</span>
                    ) : (
                      <span style={{ color: "green" }}>선택</span>
                    )}
                  </td>
                  <td style={{ padding: "10px" }}>
                    {new Date(release.releasedAt).toLocaleString("ko-KR")}
                  </td>
                  <td style={{ padding: "10px", textAlign: "center" }}>
                    <button
                      onClick={() => handleEdit(release)}
                      style={{
                        marginRight: "5px",
                        padding: "5px 10px",
                        backgroundColor: "#2196F3",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer"
                      }}
                    >
                      수정
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`${release.version} 버전을 삭제하시겠습니까?`)) {
                          remove(release.id);
                        }
                      }}
                      disabled={isDeleting}
                      style={{
                        padding: "5px 10px",
                        backgroundColor: "#f44336",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: isDeleting ? "not-allowed" : "pointer"
                      }}
                    >
                      삭제
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
