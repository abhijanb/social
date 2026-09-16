export type PeerConn = {
  pc: RTCPeerConnection
  makingOffer: boolean
  pendingIce: RTCIceCandidateInit[]
}

// Shared peer-connection teardown for livestreams – extracted from
// useLivestreamVideo (duplicated in leave + livestream:ended).
export function closeAllPeers(pcs: Map<string, PeerConn>): void {
  for (const [, entry] of pcs) {
    try {
      entry.pc.close()
    } catch {
      // already closed
    }
  }
  pcs.clear()
}
