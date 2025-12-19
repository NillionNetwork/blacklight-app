import axios from "axios";
import type {
  PhalaInfoResponse,
  PhalaAttestationResponse,
  EventLogEntry,
  VmConfig,
} from "@/types/phala";

export interface ValidationResult {
  success: boolean;
  error?: string;
  details?: {
    infoEndpoint?: {
      success: boolean;
      error?: string;
    };
    attestationEndpoint?: {
      success: boolean;
      error?: string;
    };
  };
}

export async function validatePhalaEndpoints(cvmUrl: string): Promise<ValidationResult> {
  const baseUrl = cvmUrl.replace(/\/$/, "");
  const details: ValidationResult["details"] = {};

  // Validate /info endpoint
  try {
    const infoResponse = await axios.get<PhalaInfoResponse>(`${baseUrl}/info`, {
      timeout: 10000,
    });

    if (!infoResponse.data) {
      details.infoEndpoint = {
        success: false,
        error: "No data received from /info endpoint",
      };
    } else if (!infoResponse.data.tcb_info) {
      details.infoEndpoint = {
        success: false,
        error: "Missing 'tcb_info' in response",
      };
    } else if (!infoResponse.data.tcb_info.app_compose) {
      details.infoEndpoint = {
        success: false,
        error: "Missing 'app_compose' in tcb_info",
      };
    } else if (typeof infoResponse.data.tcb_info.app_compose !== "string") {
      details.infoEndpoint = {
        success: false,
        error: "app_compose must be a string",
      };
    } else {
      details.infoEndpoint = { success: true };
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.code === "ECONNREFUSED" || error.code === "ENOTFOUND") {
        details.infoEndpoint = {
          success: false,
          error: `Cannot connect to ${baseUrl}/info - check if the URL is correct`,
        };
      } else if (error.response) {
        details.infoEndpoint = {
          success: false,
          error: `HTTP ${error.response.status}: ${error.response.statusText}`,
        };
      } else if (error.request) {
        details.infoEndpoint = {
          success: false,
          error: "No response received from /info endpoint",
        };
      } else {
        details.infoEndpoint = {
          success: false,
          error: error.message || "Unknown error fetching /info endpoint",
        };
      }
    } else {
      details.infoEndpoint = {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  // Validate /attestation endpoint
  try {
    const attestationResponse = await axios.get<PhalaAttestationResponse>(
      `${baseUrl}/attestation`,
      {
        timeout: 10000,
      }
    );

    if (!attestationResponse.data) {
      details.attestationEndpoint = {
        success: false,
        error: "No data received from /attestation endpoint",
      };
    } else {
      const data = attestationResponse.data;
      const errors: string[] = [];

      // Validate quote
      if (!data.quote || typeof data.quote !== "string") {
        errors.push("Missing or invalid 'quote' field (must be a string)");
      }

      // Validate event_log (should be a JSON string)
      if (!data.event_log || typeof data.event_log !== "string") {
        errors.push("Missing or invalid 'event_log' field (must be a JSON string)");
      } else {
        try {
          const eventLog = JSON.parse(data.event_log);
          if (!Array.isArray(eventLog)) {
            errors.push("event_log must be a JSON array");
          } else {
            eventLog.forEach((entry: any, index: number) => {
              if (!entry || typeof entry !== "object") {
                errors.push(`event_log[${index}] is not an object`);
                return;
              }
              const requiredFields: (keyof EventLogEntry)[] = [
                "imr",
                "event_type",
                "digest",
                "event",
                "event_payload",
              ];
              requiredFields.forEach((field) => {
                if (!(field in entry)) {
                  errors.push(`event_log[${index}] missing required field: ${field}`);
                } else if (field === "imr" || field === "event_type") {
                  if (typeof entry[field] !== "number") {
                    errors.push(
                      `event_log[${index}].${field} must be a number`
                    );
                  }
                } else if (typeof entry[field] !== "string") {
                  errors.push(`event_log[${index}].${field} must be a string`);
                }
              });
            });
          }
        } catch (parseError) {
          errors.push(`Failed to parse event_log as JSON: ${parseError instanceof Error ? parseError.message : "Invalid JSON"}`);
        }
      }

      // Validate vm_config (should be a JSON string)
      if (!data.vm_config || typeof data.vm_config !== "string") {
        errors.push("Missing or invalid 'vm_config' field (must be a JSON string)");
      } else {
        try {
          const vmConfig = JSON.parse(data.vm_config);
          if (!vmConfig || typeof vmConfig !== "object") {
            errors.push("vm_config must be a JSON object");
          } else {
            const vmConfigFields: (keyof VmConfig)[] = [
              "spec_version",
              "os_image_hash",
              "cpu_count",
              "memory_size",
              "qemu_single_pass_add_pages",
              "pic",
              "pci_hole64_size",
              "hugepages",
              "num_gpus",
              "num_nvswitches",
              "hotplug_off",
            ];

            vmConfigFields.forEach((field) => {
              if (!(field in vmConfig)) {
                errors.push(`vm_config missing required field: ${field}`);
              } else {
                const value = vmConfig[field];
                if (
                  field === "spec_version" ||
                  field === "cpu_count" ||
                  field === "memory_size" ||
                  field === "pci_hole64_size" ||
                  field === "num_gpus" ||
                  field === "num_nvswitches"
                ) {
                  if (typeof value !== "number") {
                    errors.push(`vm_config.${field} must be a number`);
                  }
                } else if (
                  field === "qemu_single_pass_add_pages" ||
                  field === "pic" ||
                  field === "hugepages" ||
                  field === "hotplug_off"
                ) {
                  if (typeof value !== "boolean") {
                    errors.push(`vm_config.${field} must be a boolean`);
                  }
                } else if (typeof value !== "string") {
                  errors.push(`vm_config.${field} must be a string`);
                }
              }
            });
          }
        } catch (parseError) {
          errors.push(`Failed to parse vm_config as JSON: ${parseError instanceof Error ? parseError.message : "Invalid JSON"}`);
        }
      }

      if (errors.length > 0) {
        details.attestationEndpoint = {
          success: false,
          error: errors.join("; "),
        };
      } else {
        details.attestationEndpoint = { success: true };
      }
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.code === "ECONNREFUSED" || error.code === "ENOTFOUND") {
        details.attestationEndpoint = {
          success: false,
          error: `Cannot connect to ${baseUrl}/attestation - check if the URL is correct`,
        };
      } else if (error.response) {
        details.attestationEndpoint = {
          success: false,
          error: `HTTP ${error.response.status}: ${error.response.statusText}`,
        };
      } else if (error.request) {
        details.attestationEndpoint = {
          success: false,
          error: "No response received from /attestation endpoint",
        };
      } else {
        details.attestationEndpoint = {
          success: false,
          error: error.message || "Unknown error fetching /attestation endpoint",
        };
      }
    } else {
      details.attestationEndpoint = {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  // Determine overall success
  const infoSuccess = details.infoEndpoint?.success ?? false;
  const attestationSuccess = details.attestationEndpoint?.success ?? false;

  if (infoSuccess && attestationSuccess) {
    return { success: true, details };
  }

  // Build error message
  const errors: string[] = [];
  if (!infoSuccess && details.infoEndpoint?.error) {
    errors.push(`/info endpoint: ${details.infoEndpoint.error}`);
  }
  if (!attestationSuccess && details.attestationEndpoint?.error) {
    errors.push(`/attestation endpoint: ${details.attestationEndpoint.error}`);
  }

  return {
    success: false,
    error: errors.join(" | "),
    details,
  };
}

