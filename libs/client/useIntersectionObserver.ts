import { RefObject, useEffect, useState } from "react";

/* 
Your must pass the ref element (from useRef()).

It takes optionally root, rootMargin and threshold arguments 
and freezeOnceVisible to only catch the first appearance too.

It returns the full IntersectionObserver's entry object. 
*/

interface Args extends IntersectionObserverInit {
  freezeOnceVisible?: boolean;
}

export function useIntersectionObserver(
  elementRef: RefObject<Element>,
  { threshold = 0, root = null, rootMargin = "0%", freezeOnceVisible = false }: Args
): IntersectionObserverEntry | undefined {
  const [entry, setEntry] = useState<IntersectionObserverEntry>();

  const frozen = entry?.isIntersecting && freezeOnceVisible;

  // 콜백함수의 첫 인자는 observer.observe로 획득한 요소들을 배열로 받는다.
  // 여기서는 하나 뿐이어서 구조 분해 할당으로 맨 앞 요소만 가져왔다.
  const updateEntry = ([entry]: IntersectionObserverEntry[]): void => {
    //console.log("updateEntry called. entry: ", entry);
    setEntry(entry);
  };

  useEffect(() => {
    const node = elementRef?.current; // DOM Ref
    const hasIOSupport = !!window.IntersectionObserver;

    if (!hasIOSupport || frozen || !node) {
      console.log("returned----!hasIOSupport || frozen || !node");
      return;
    }

    const observerParams = { threshold, root, rootMargin };
    const observer = new IntersectionObserver(updateEntry, observerParams); // 겹치는 것을 측정하는 동글을 만들고

    observer.observe(node); // 그 동글을 node에 부착한다.  node가 겹치는 조건에 해당하면 updateEntry를 수행한다.

    return () => observer.disconnect();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elementRef?.current, JSON.stringify(threshold), root, rootMargin, frozen]);

  return entry;
}
