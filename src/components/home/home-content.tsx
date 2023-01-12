import { useWallet } from "@solana/wallet-adapter-react";
import React from "react";
import { useDataFetch } from "@utils/use-data-fetch";
import { ItemList } from "@components/home/item-list";
import { SignButton } from "@components/home/sign-button";
import { ItemData } from "@components/home/item";
import bs58 from "bs58";

export function HomeContent() {
  const { publicKey, signMessage } = useWallet();
  const { data, error } = useDataFetch<Array<ItemData>>(
    publicKey ? `/api/items/${publicKey}` : null
  );
  const [state, setState] = React.useState<
    "initial" | "verifying" | "success" | "error"
  >("initial");

  React.useEffect(() => {
    if (state !== "initial" && !publicKey) {
      setState("initial");
    }
  }, [publicKey]);

  const onClick = async () => {
    if (publicKey && signMessage) {
      if (state !== "success") {
        setState("verifying");
      }

      try {
        // Encode anything as bytes
        const messageStr = "This can be anything you want!";
        const message = new TextEncoder().encode(messageStr);

        // Sign the bytes using the wallet
        const signature = await signMessage(message);
        const publicKeyStr = publicKey.toBase58();

        const data = {
          publicKeyStr,
          encodedSignature: bs58.encode(signature),
          messageStr,
        };

        let response = await fetch("/api/sign", {
          method: "POST",
          body: JSON.stringify(data),
          headers: { "Content-type": "application/json; charset=UTF-8" },
        });

        if (response.status === 200) {
          setState("success");
        } else {
          setState("error");
        }
      } catch (error: any) {
        setState("error");
      }
    }
  };

  if (error) {
    return (
      <p className="text-center p-4">
        Failed to load items, please try connecting again
      </p>
    );
  }

  if (publicKey && !data) {
    return <p className="text-center p-4">Loading wallet information...</p>;
  }

  return (
    <div className="grid grid-cols-1">
      <div className="text-center">
        {publicKey ? (
          state !== "success" && (
            <div className="card shadow-xl bg-neutral mb-5">
              <div className="card-body items-center text-center">
                <h2 className="card-title text-center">
                  Please verify your wallet to see items
                </h2>
                <SignButton state={state} onClick={onClick} />
              </div>
            </div>
          )
        ) : (
          <p className="p-4">
            Please connect your wallet to get a list of your NFTs
          </p>
        )}
      </div>
      {publicKey && state === "success" && data && <ItemList items={data} />}
    </div>
  );
}
