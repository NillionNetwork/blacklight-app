import axios from "axios";
import type {
  HtxPhala,
  PhalaInfoResponse,
  PhalaAttestationResponse,
} from "@/types/phala";

export async function extractPhalaHtx(cvmUrl: string): Promise<HtxPhala> {
  // Normalize URL (remove trailing slash)
  const baseUrl = cvmUrl.replace(/\/$/, "");

  // Fetch info endpoint
  const infoResponse = await axios.get<PhalaInfoResponse>(
    `${baseUrl}/info`
  );

  if (!infoResponse.data.tcb_info?.app_compose) {
    throw new Error("Missing app_compose in tcb_info");
  }

  const app_compose = infoResponse.data.tcb_info.app_compose;

  // Fetch attestation endpoint
  const attestationResponse = await axios.get<PhalaAttestationResponse>(
    `${baseUrl}/attestation`
  );

  // Keep event_log as string (don't parse it)
  // Exclude vm_config from HTX
  const attest_data = {
    quote: attestationResponse.data.quote,
    event_log: attestationResponse.data.event_log, // Keep as string
  };

  return {
    provider: "phala",
    app_compose,
    attest_data,
  };
}

export async function validatePhalaUrl(cvmUrl: string): Promise<boolean> {
  try {
    await extractPhalaHtx(cvmUrl);
    return true;
  } catch (error) {
    console.error("Phala URL validation failed:", error);
    return false;
  }
}


