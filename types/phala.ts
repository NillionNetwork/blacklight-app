// Phala HTX types (matching Rust types)

export interface EventLogEntry {
  imr: number;
  event_type: number;
  digest: string;
  event: string;
  event_payload: string;
}

export interface VmConfig {
  spec_version: number;
  os_image_hash: string;
  cpu_count: number;
  memory_size: number;
  qemu_single_pass_add_pages: boolean;
  pic: boolean;
  pci_hole64_size: number;
  hugepages: boolean;
  num_gpus: number;
  num_nvswitches: number;
  hotplug_off: boolean;
}

// Attestation data for HTX (excludes vm_config)
export interface HtxAttestData {
  quote: string;
  event_log: string; // JSON string, not parsed
}

export interface HtxPhala {
  provider: "phala";
  app_compose: string;
  attest_data: HtxAttestData;
}

export interface PhalaInfoResponse {
  tcb_info: {
    app_compose: string;
  };
}

export interface PhalaAttestationResponse {
  quote: string;
  event_log: string; // JSON string, not parsed
  vm_config: string; // JSON string, not parsed
}


