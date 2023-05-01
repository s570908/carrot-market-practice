import { delay, usePromise } from "@libs/utils";
import { Suspense } from "react";

const cache: any = {};
export function fetchData(url: string) {
  if (!cache[url]) {
    throw Promise.all([
      fetch(url)
        .then((r) => r.json())
        .then((json) => (cache[url] = json)),
      delay(Math.round(Math.random() * 10555)),
    ]);
  }
  return cache[url];
}

export function Coin({ id, name, symbol }: any) {
  console.log(id, name, symbol);
  const data = usePromise<any, any>(fetchTickers, id);
  if (!data) return null;
  //console.log("Coin, data: ", data);
  const {
    quotes: {
      USD: { price },
    },
  } = data;
  return (
    <span>
      {name} / {symbol}: ${price}
    </span>
  );
}

async function fetchTickers(id: string) {
  console.log("Async - Start fetchTickers");
  const url = `https://api.coinpaprika.com/v1/tickers/${id}`;
  await delay(Math.round(Math.random() * 10555));
  const response = await fetch(url);
  return await response.json();
}

async function fetchCoins() {
  console.log("Async - Start fetchCoins");
  const url = "https://api.coinpaprika.com/v1/coins";
  await delay(Math.round(Math.random() * 10555));
  const response = await fetch(url);
  console.log("Async - Resolved fetchCoins");
  return await response.json();
}

export function List() {
  //const coins = fetchData("https://api.coinpaprika.com/v1/coins");
  const coins = usePromise<any, any>(fetchCoins, null);
  //console.log("Render - Rendering List, coins");
  if (!coins) return null;
  console.log("Render - Rendering List, coins: ", coins);
  return (
    <div>
      <h4>List is done</h4>
      <ul className="ml-3 list-disc">
        {coins.slice(0, 10).map((coin: any) => (
          <li key={coin.id}>
            <Suspense fallback={<p className="text-red-700">{`Coin ${coin.name} is loading`}</p>}>
              <Coin {...coin} />
            </Suspense>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Coins() {
  return (
    <div>
      <h1>Welcome to RSC</h1> <br />
      <Suspense fallback={<p className="text-red-700">List is loading...</p>}>
        <List />
      </Suspense>
    </div>
  );
}
