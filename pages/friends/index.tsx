import React, { useState, useEffect, useRef } from "react";
import Layout from "@/components/Layout";
import ModButton from "@/components/ModButton";
import { useQuery, useMutation, useInfiniteQuery } from "@tanstack/react-query";
import { addFriend, getFriends, removeFriend, searchUsers } from "@/apiLibs/friends";
import Image from "next/image";
import { User } from "@prisma/client";
import ImgComponent from "@/components/ImgComponent";

interface Friend {
  id: number;
  name: string;
  avatar?: string;
}

const FriendsPage: React.FC = () => {
  // 상태 관리
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<Friend | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [searchResults, setSearchResults] = useState<Friend[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // 무한 스크롤을 위한 참조
  const bottomObserverRef = useRef<HTMLDivElement>(null);

  // 친구 목록 조회
  const {
    data: friendsData,
    isLoading: isFriendsLoading,
    refetch: refetchFriends,
  } = useQuery({
    queryKey: ["friends"],
    queryFn: getFriends,
  });

  // 무한 스크롤로 모든 사용자 불러오기
  interface UsersResponse {
    users: Friend[];
    nextPage?: number;
  }

  const {
    data: usersData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isUsersLoading,
  } = useInfiniteQuery<UsersResponse, Error>({
    queryKey: ["users"],
    initialPageParam: 1,
    queryFn: ({ pageParam }) => searchUsers(pageParam as number, 20),
    getNextPageParam: (lastPage) => lastPage.nextPage || undefined,
  });

  // Intersection Observer 설정
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.5 }
    );

    if (bottomObserverRef.current) {
      observer.observe(bottomObserverRef.current);
    }

    return () => {
      if (bottomObserverRef.current) {
        observer.unobserve(bottomObserverRef.current);
      }
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // 친구 추가 뮤테이션
  const { mutate: addFriendMutation, isPending: isAdding } = useMutation({
    mutationFn: (name: string) => addFriend(name),
    onSuccess: () => {
      refetchFriends(); // 친구 목록 갱신
      setSearchTerm(""); // 입력 필드 초기화
      setSelectedUser(null); // 선택된 사용자 초기화
      setShowModal(false); // 모달 닫기
      setSearchError(""); // 에러 메시지 초기화
    },
    onError: (error) => {
      setSearchError("친구 추가 중 오류가 발생했습니다.");
    },
  });

  // 친구 제거 뮤테이션
  const { mutate: removeFriendMutation, isPending: isRemoving } = useMutation({
    mutationFn: (id: number) => removeFriend(id),
    onSuccess: () => {
      refetchFriends(); // 친구 목록 갱신
    },
  });

  // 사용자 검색 함수
  const searchFriends = async () => {
    if (!searchTerm.trim()) {
      setSearchError("친구 이름을 입력해주세요.");
      return;
    }

    setIsSearching(true);
    setSearchError("");

    try {
      const response = await fetch(`/api/users/search?name=${encodeURIComponent(searchTerm)}`);
      const data = await response.json();

      if (data.ok) {
        setSearchResults(data.users);
        setShowSearchResults(true);

        if (data.users.length === 0) {
          setSearchError("검색 결과가 없습니다.");
        }
      } else {
        setSearchError(data.error || "검색 중 오류가 발생했습니다.");
      }
    } catch (error) {
      setSearchError("검색 중 오류가 발생했습니다.");
      console.error("사용자 검색 중 오류:", error);
    } finally {
      setIsSearching(false);
    }
  };

  // 사용자를 선택하는 핸들러
  const handleUserSelect = (user: Friend) => {
    setSelectedUser(user);
    setShowModal(true);
    setShowSearchResults(false);
  };

  // 친구 추가 핸들러
  const handleAddFriend = () => {
    if (searchTerm.trim()) {
      searchFriends();
    } else {
      setSearchError("친구 이름을 입력해주세요.");
    }
  };

  // 실제 친구 추가 처리
  const confirmAddFriend = () => {
    if (selectedUser) {
      addFriendMutation(selectedUser.name);
    }
  };

  // 친구 제거 핸들러
  const handleRemoveFriend = (id: number) => {
    if (confirm("정말로 이 친구를 삭제하시겠습니까?")) {
      removeFriendMutation(id);
    }
  };

  // 모든 사용자 목록 평면화
  const allUsers = usersData?.pages.flatMap((page) => page.users) || [];
  console.log("allUsers: ", allUsers);

  return (
    <Layout title="친구 관리" seoTitle="친구 관리 | Carrot Market">
      <div className="flex h-full flex-col">
        {/* 검색 영역 */}
        <div className="sticky top-0 z-10 bg-white p-4">
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setSearchError("");
                if (showSearchResults) setShowSearchResults(false);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddFriend();
                }
              }}
              placeholder="친구 이름 입력"
              className="flex-1 rounded-md border border-gray-300 px-3 py-2"
            />
            <ModButton
              onClick={handleAddFriend}
              isLoading={isSearching}
              variant="primary"
              size="medium"
            >
              검색
            </ModButton>
          </div>

          {searchError && <div className="mt-2 text-sm text-red-500">{searchError}</div>}
        </div>

        {/* 검색 결과 표시 */}
        {showSearchResults && searchResults.length > 0 && (
          <div className="border-t border-gray-200 p-4">
            <h2 className="mb-4 text-lg font-medium">검색 결과</h2>
            <ul className="space-y-2">
              {searchResults.map((user: Friend) => (
                <li
                  key={user.id}
                  onClick={() => handleUserSelect(user)}
                  className="flex cursor-pointer items-center rounded-md border p-3 hover:bg-gray-50"
                >
                  <div className="flex items-center space-x-2">
                    <ImgComponent
                      width={40}
                      height={40}
                      clsProps="rounded-full bg-gray-300"
                      imgAdd={`https://imagedelivery.net/${process.env.NEXT_PUBLIC_CF_HASH}/${user.avatar}/public`}
                      //imgAdd={user.avatar && isValidImageUrl(user.avatar) ? user.avatar : ""}
                      imgName={user.name}
                    />
                    <span>{user.name}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 친구 목록 */}
        <div className="border-t border-gray-200 p-4">
          <h2 className="mb-4 text-lg font-medium">친구 목록</h2>
          {isFriendsLoading ? (
            <p>친구 목록을 불러오는 중...</p>
          ) : (friendsData?.friends?.length ?? 0) > 0 ? (
            <ul className="space-y-2">
              {friendsData?.friends?.map((friend: Friend) => (
                <li
                  key={friend.id}
                  className="flex items-center justify-between border-b border-gray-100 py-2"
                >
                  <div className="flex items-center space-x-2">
                    <ImgComponent
                      width={40}
                      height={40}
                      clsProps="rounded-full bg-gray-300"
                      imgAdd={`https://imagedelivery.net/${process.env.NEXT_PUBLIC_CF_HASH}/${friend.avatar}/public`}
                      //imgAdd={friend.avatar && isValidImageUrl(friend.avatar) ? friend.avatar : ""}
                      imgName={friend.name}
                    />
                    <span className="font-medium">{friend.name}</span>
                  </div>
                  <ModButton
                    onClick={() => handleRemoveFriend(friend.id)}
                    isLoading={isRemoving}
                    variant="danger"
                    size="small"
                  >
                    삭제
                  </ModButton>
                </li>
              ))}
            </ul>
          ) : (
            <p>친구 목록이 비어 있습니다.</p>
          )}
        </div>

        {/* 모든 사용자 목록 */}
        {!showSearchResults && (
          <div className="flex-1 overflow-y-auto border-t border-gray-200 p-4">
            <h2 className="mb-4 text-lg font-medium">사용자 목록</h2>
            {isUsersLoading && allUsers.length === 0 ? (
              <p>사용자 목록을 불러오는 중...</p>
            ) : (
              <>
                <ul className="space-y-2">
                  {allUsers.map((user: Friend) => (
                    <li
                      key={user.id}
                      onClick={() => handleUserSelect(user)}
                      className="flex cursor-pointer items-center rounded-md border p-3 hover:bg-gray-50"
                    >
                      <div className="flex items-center space-x-2">
                        <ImgComponent
                          width={40}
                          height={40}
                          clsProps="rounded-full bg-gray-300"
                          imgAdd={`https://imagedelivery.net/${process.env.NEXT_PUBLIC_CF_HASH}/${user.avatar}/public`}
                          //imgAdd={user.avatar && isValidImageUrl(user.avatar) ? user.avatar : ""}
                          imgName={user.name}
                        />
                        <span>{user.name}</span>
                      </div>
                    </li>
                  ))}
                </ul>
                <div ref={bottomObserverRef} className="flex h-10 items-center justify-center">
                  {isFetchingNextPage && <p>더 불러오는 중...</p>}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* 사용자 선택 모달 */}
      {showModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6">
            <h3 className="mb-4 text-lg font-medium">친구 추가</h3>
            <div className="mb-4 flex items-center space-x-2">
              <ImgComponent
                width={48}
                height={48}
                clsProps="rounded-full bg-gray-300"
                imgAdd={`https://imagedelivery.net/${process.env.NEXT_PUBLIC_CF_HASH}/${selectedUser.avatar}/public`}
                // imgAdd={
                //   selectedUser.avatar && isValidImageUrl(selectedUser.avatar)
                //     ? selectedUser.avatar
                //     : ""
                // }
                imgName={selectedUser.name}
              />
              <span className="font-medium">{selectedUser.name}</span>
            </div>
            <p className="mb-4">이 사용자를 친구로 추가하시겠습니까?</p>
            <div className="flex justify-end space-x-2">
              <ModButton onClick={() => setShowModal(false)} variant="outline">
                취소
              </ModButton>
              <ModButton onClick={confirmAddFriend} isLoading={isAdding} variant="primary">
                확인
              </ModButton>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default FriendsPage;
