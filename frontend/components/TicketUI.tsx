"use client";
import { useState } from "react";
import { useAccount, useChainId, useReadContract, useWriteContract } from "wagmi";
import { parseAbi } from "viem";

const abi = parseAbi([
  "function createEvent(uint256 eventId,string name,uint256 maxSupply,string uriPrefix)",
  "function mintTicket(address to,uint256 eventId) returns (uint256)",
  "function burn(uint256 tokenId)",
  "function isValidTicket(uint256 tokenId) view returns (bool,uint256,address)",
  "function ownerOf(uint256 tokenId) view returns (address)"
]);

export default function TicketUI() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const [contract, setContract] = useState<string>(""); // deloy and set your contract address here

  // create event
  const [eventId, setEventId] = useState<number>(1);
  const [name, setName] = useState("Demo Event");
  const [maxSupply, setMaxSupply] = useState<number>(1000);
  const [uriPrefix, setUriPrefix] = useState("ipfs://EVENT1_CID/");

  // mint
  const [mintAddr, setMintAddr] = useState<string>("");
  const [mintEventId, setMintEventId] = useState<number>(1);

  // verify
  const [tokenId, setTokenId] = useState<string>("");

  const { writeContractAsync } = useWriteContract();

  const { data: validResp } = useReadContract({
    abi,
    address: contract as `0x${string}`,
    functionName: "isValidTicket",
    args: tokenId ? [BigInt(tokenId)] : undefined,
    query: { enabled: !!contract && !!tokenId }
  }) as { data: [boolean, bigint, `0x${string}`] | undefined };

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <section>
        <label>Contract Address</label><br/>
        <input value={contract} onChange={(e)=>setContract(e.target.value)} placeholder="0x..." style={{width:"100%"}} />
        <p style={{fontSize:12}}>Connected: {isConnected ? address : "Not connected"} | chainId: {chainId}</p>
      </section>

      <section style={{border:"1px solid #eee", padding:12}}>
        <h3>Create Event (owner only)</h3>
        <input value={eventId} onChange={e=>setEventId(Number(e.target.value))} placeholder="eventId" />
        <input value={name} onChange={e=>setName(e.target.value)} placeholder="name" />
        <input value={maxSupply} onChange={e=>setMaxSupply(Number(e.target.value))} placeholder="maxSupply (0=unlimited)" />
        <input value={uriPrefix} onChange={e=>setUriPrefix(e.target.value)} placeholder="ipfs://..." />
        <button onClick={async ()=>{
          if(!contract) return alert("Set contract");
          await writeContractAsync({ address: contract as `0x${string}`, abi, functionName: "createEvent", args:[BigInt(eventId), name, BigInt(maxSupply), uriPrefix] });
          alert("Event created");
        }}>Create</button>
      </section>

      <section style={{border:"1px solid #eee", padding:12}}>
        <h3>Mint Ticket (owner only)</h3>
        <input value={mintAddr} onChange={e=>setMintAddr(e.target.value)} placeholder="recipient 0x..." />
        <input value={mintEventId} onChange={e=>setMintEventId(Number(e.target.value))} placeholder="eventId" />
        <button onClick={async ()=>{
          if(!contract) return alert("Set contract");
          const hash = await writeContractAsync({ address: contract as `0x${string}`, abi, functionName: "mintTicket", args:[mintAddr as `0x${string}`, BigInt(mintEventId)] });
          alert("Mint tx: "+hash);
        }}>Mint</button>
      </section>

      <section style={{border:"1px solid #eee", padding:12}}>
        <h3>Verify Ownership / Validity</h3>
        <input value={tokenId} onChange={e=>setTokenId(e.target.value)} placeholder="tokenId" />
        {validResp && (
          <div>
            <p>Valid: {String(validResp[0])}</p>
            <p>EventId: {validResp[1].toString()}</p>
            <p>Owner: {validResp[2]}</p>
          </div>
        )}
      </section>
    </div>
  );
}
