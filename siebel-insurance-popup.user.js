// ==UserScript==
// @name         Siebel Insurance Expiry Advisor Popup
// @namespace    https://tcmotors.internal
// @version      1.0.2
// @description  Insurance expiry popup inside Siebel job card
// @match        https://carsdms.inservices.tatamotors.com/*
// @run-at       document-end
// @grant        GM_xmlhttpRequest
// @updateURL    https://raw.githubusercontent.com/anujchowdhury/siebel-insurance-popup/main/siebel-insurance-popup.user.js
// @downloadURL  https://raw.githubusercontent.com/anujchowdhury/siebel-insurance-popup/main/siebel-insurance-popup.user.js

// ==/UserScript==


(function () {
    'use strict';
    console.log("Insurance Popup Script v1.0.2 loaded");

    /**************************************
     * CONFIG
     **************************************/
    const INSURANCE_API_URL =
        "https://script.google.com/macros/s/AKfycbxCvmGY3VRmDLNwzFdCGbZf0HH0PmtvkPIJ-haBHu54v143UlPOb4ol7tIsLB5dnUFJ/exec";

    const MAX_THRESHOLD_DAYS = 35;
    const URGENT_THRESHOLD_DAYS = 20;

    let lastJobCard = null;
    let showPopup = false;
    let insuranceInfo = null;
    let dismissed = false;

    /**************************************
     * FIELD READERS (Siebel)
     **************************************/
    function getJobCardNo() {
        const el = document.querySelector('input[aria-label="Job Card  #"]');
        return el && el.value ? el.value.trim() : null;
    }

    function getChassisNo() {
        const el = document.querySelector('input[aria-label="Chassis No"]');
        return el && el.value ? el.value.trim() : null;
    }

    /**************************************
     * COLOR THEME LOGIC
     **************************************/
    function getTheme(expiryDays) {
        if (expiryDays <= URGENT_THRESHOLD_DAYS) {
            return {
                bg: "#f8d7da",
                border: "#f1aeb5",
                text: "#842029",
                label: "URGENT"
            };
        }
        return {
            bg: "#fff3cd",
            border: "#ffecb5",
            text: "#664d03",
            label: "WARNING"
        };
    }

    /**************************************
     * BACKEND API CALL
     **************************************/
    function fetchInsuranceStatus(jobCardNo, chassisNo) {
  return new Promise((resolve) => {
    GM_xmlhttpRequest({
      method: "POST",
      url: INSURANCE_API_URL,
      headers: {
        "Content-Type": "application/json"
      },
      data: JSON.stringify({
        jobCardNo: jobCardNo,
        chassisNo: chassisNo,
        source: "siebel_popup"
      }),
      onload: function (response) {
        try {
          const data = JSON.parse(response.responseText);
          console.log("📦 Insurance API response:", data);
          resolve(data);
        } catch (e) {
          console.error("❌ JSON parse error:", response.responseText);
          resolve(null);
        }
      },
      onerror: function () {
        resolve(null);
      }
    });
  });
}


    /**************************************
     * POPUP UI
     **************************************/
    function renderPopup() {
        if (!insuranceInfo || typeof insuranceInfo.expiryDays !== "number") return;
        if (document.getElementById("insurance-expiry-popup")) return;
        if (dismissed) return;

        const theme = getTheme(insuranceInfo.expiryDays);

        const popup = document.createElement("div");
        popup.id = "insurance-expiry-popup";

        popup.innerHTML = `
            <div style="
                position: fixed;
                top: 90px;
                right: 20px;
                width: 360px;
                background: ${theme.bg};
                color: ${theme.text};
                border: 2px solid ${theme.border};
                border-radius: 10px;
                padding: 18px;
                font-family: Arial, sans-serif;
                font-size: 15px;
                z-index: 99999;
                box-shadow: 0 4px 12px rgba(0,0,0,0.18);
                opacity: 0.85;
                transition: opacity 0.25s ease;
            "
            onmouseover="this.style.opacity='1'"
            onmouseout="this.style.opacity='0.85'"
            >

                <div style="display:flex;justify-content:space-between;align-items:center;">
                    <strong>⚠ INSURANCE EXPIRING SOON</strong>
                    <span id="insurance-popup-close"
                          style="cursor:pointer;font-weight:bold;font-size:16px;"
                          title="Close">✕</span>
                </div>

                <hr style="border:none;border-top:1px solid ${theme.border};margin:8px 0">

                <div><b>Expiry Date:</b> ${insuranceInfo.expiryDate}</div>
                <div><b>Days Left:</b> ${insuranceInfo.expiryDays}</div>
                <div><b>Renewal Type:</b> ${insuranceInfo.renewalType}</div>


                <div style="margin-top:10px;">
                    Please pitch <b>TC Motors Insurance</b> to the customer.
                </div>
            </div>
        `;

        document.body.appendChild(popup);

        const closeBtn = document.getElementById("insurance-popup-close");
        if (closeBtn) {
            closeBtn.addEventListener("click", function () {
                dismissed = true;
                removePopup();
            });
        }
    }

    function removePopup() {
        const el = document.getElementById("insurance-expiry-popup");
        if (el) el.remove();
    }

    /**************************************
     * JOB CARD WATCHER (ONE API CALL PER JC)
     **************************************/
    setInterval(() => {
        const jobCardNo = getJobCardNo();
        const chassisNo = getChassisNo();

        if (!jobCardNo || !chassisNo) return;

        if (jobCardNo !== lastJobCard) {
            lastJobCard = jobCardNo;
            dismissed = false;
            showPopup = false;
            insuranceInfo = null;
            removePopup();

            fetchInsuranceStatus(jobCardNo, chassisNo).then(data => {
                if (!data || !data.showPopup) {
                    showPopup = false;
                    removePopup();
                    return;
                }

                insuranceInfo = {
                    expiryDate: data.expiryDate,
                    expiryDays: data.expiryDays,
                    urgency: data.urgency,
                    renewalType: data.renewalType || 'UNKNOWN'
                };

                showPopup = true;
            });
        }
    }, 1000);

    /**************************************
     * POPUP PERSISTENCE
     **************************************/
    setInterval(() => {
        if (showPopup && !dismissed) {
            renderPopup();
        } else {
            removePopup();
        }
    }, 1500);

})();
