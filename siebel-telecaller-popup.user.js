{\rtf1\ansi\ansicpg1252\cocoartf2580
\cocoatextscaling0\cocoaplatform0{\fonttbl\f0\fswiss\fcharset0 Helvetica;\f1\fnil\fcharset0 AppleColorEmoji;\f2\fnil\fcharset128 HiraginoSans-W3;
\f3\fnil\fcharset77 ZapfDingbatsITC;}
{\colortbl;\red255\green255\blue255;}
{\*\expandedcolortbl;;}
\paperw11900\paperh16840\margl1440\margr1440\vieww11520\viewh8400\viewkind0
\pard\tx566\tx1133\tx1700\tx2267\tx2834\tx3401\tx3968\tx4535\tx5102\tx5669\tx6236\tx6803\pardirnatural\partightenfactor0

\f0\fs24 \cf0 // ==UserScript==\
// @name         Siebel Insurance Expiry Telecaller Popup\
// @namespace    https://tcmotors.internal\
// @version      1.0.0\
// @description  Insurance expiry popup inside Siebel Vehicles page\
// @match        https://carsdms.inservices.tatamotors.com/*\
// @run-at       document-end\
// @grant        GM_xmlhttpRequest\
// @connect      script.googleusercontent.com\
// ==/UserScript==\
\
(function () \{\
    'use strict';\
    console.log("
\f1 \uc0\u55357 \u56542 
\f0  Telecaller Insurance Popup Script v1.0.0 loaded");\
\
    /**************************************\
     * CONFIG\
     **************************************/\
    const INSURANCE_API_URL =\
        "https://script.google.com/macros/s/AKfycbxCvmGY3VRmDLNwzFdCGbZf0HH0PmtvkPIJ-haBHu54v143UlPOb4ol7tIsLB5dnUFJ/exec";\
\
    const MAX_THRESHOLD_DAYS = 35;\
    const URGENT_THRESHOLD_DAYS = 20;\
\
    let lastVehicleKey = null;\
    let showPopup = false;\
    let insuranceInfo = null;\
    let dismissed = false;\
    let lastPopupTime = 0;\
\
    /**************************************\
     * FIELD READERS \'96 VEHICLES PAGE\
     **************************************/\
    function getChassisNo() \{\
        const el = document.querySelector('input[aria-label="Chassis No"]');\
        return el && el.value ? el.value.trim() : null;\
    \}\
\
    function getRegistrationNo() \{\
        const el = document.querySelector('input[aria-label="Vehicle Registration Number"]');\
        return el && el.value ? el.value.trim() : null;\
    \}\
\
    /**************************************\
     * COLOR THEME LOGIC (SAME AS ADVISOR)\
     **************************************/\
    function getTheme(expiryDays) \{\
        if (expiryDays <= URGENT_THRESHOLD_DAYS) \{\
            return \{\
                bg: "#f8d7da",\
                border: "#f1aeb5",\
                text: "#842029",\
                label: "URGENT"\
            \};\
        \}\
        return \{\
            bg: "#fff3cd",\
            border: "#ffecb5",\
            text: "#664d03",\
            label: "WARNING"\
        \};\
    \}\
\
    /**************************************\
     * BACKEND API CALL (UNCHANGED)\
     **************************************/\
    function fetchInsuranceStatus(chassisNo) \{\
        return new Promise((resolve) => \{\
            GM_xmlhttpRequest(\{\
                method: "POST",\
                url: INSURANCE_API_URL,\
                headers: \{\
                    "Content-Type": "application/json"\
                \},\
                data: JSON.stringify(\{\
                    chassisNo: chassisNo,\
                    source: "siebel_telecaller"\
                \}),\
                onload: function (response) \{\
                    try \{\
                        const data = JSON.parse(response.responseText);\
                        console.log("
\f1 \uc0\u55357 \u56550 
\f0  Insurance API response:", data);\
                        resolve(data);\
                    \} catch (e) \{\
                        console.error("
\f1 \uc0\u10060 
\f0  JSON parse error:", response.responseText);\
                        resolve(null);\
                    \}\
                \},\
                onerror: function () \{\
                    resolve(null);\
                \}\
            \});\
        \});\
    \}\
\
    /**************************************\
     * POPUP UI (IDENTICAL TO ADVISOR)\
     **************************************/\
    function renderPopup() \{\
        if (!insuranceInfo || typeof insuranceInfo.expiryDays !== "number") return;\
        if (document.getElementById("insurance-expiry-popup")) return;\
        if (dismissed) return;\
\
        const theme = getTheme(insuranceInfo.expiryDays);\
\
        const popup = document.createElement("div");\
        popup.id = "insurance-expiry-popup";\
\
        popup.innerHTML = `\
            <div style="\
                position: fixed;\
                top: 90px;\
                right: 20px;\
                width: 360px;\
                background: $\{theme.bg\};\
                color: $\{theme.text\};\
                border: 2px solid $\{theme.border\};\
                border-radius: 10px;\
                padding: 18px;\
                font-family: Arial, sans-serif;\
                font-size: 15px;\
                z-index: 99999;\
                box-shadow: 0 4px 12px rgba(0,0,0,0.18);\
                opacity: 0.88;\
                transition: opacity 0.25s ease;\
            "\
            onmouseover="this.style.opacity='1'"\
            onmouseout="this.style.opacity='0.88'"\
            >\
\
                <div style="display:flex;justify-content:space-between;align-items:center;">\
                    <strong>
\f2 \uc0\u9888 
\f0  INSURANCE EXPIRING SOON</strong>\
                    <span id="insurance-popup-close"\
                          style="cursor:pointer;font-weight:bold;font-size:16px;"\
                          title="Close">
\f3 \uc0\u10005 
\f0 </span>\
                </div>\
\
                <hr style="border:none;border-top:1px solid $\{theme.border\};margin:8px 0">\
\
                <div><b>Expiry Date:</b> $\{insuranceInfo.expiryDate\}</div>\
                <div><b>Days Left:</b> $\{insuranceInfo.expiryDays\}</div>\
                <div><b>Renewal Type:</b> $\{insuranceInfo.renewalType\}</div>\
\
                <div style="margin-top:10px;">\
                    Please pitch <b>TC Motors Insurance</b> to the customer.\
                </div>\
            </div>\
        `;\
\
        document.body.appendChild(popup);\
\
        document.getElementById("insurance-popup-close")\
            .addEventListener("click", () => \{\
                dismissed = true;\
                removePopup();\
            \});\
    \}\
\
    function removePopup() \{\
        const el = document.getElementById("insurance-expiry-popup");\
        if (el) el.remove();\
    \}\
\
    /**************************************\
     * VEHICLE WATCHER (MAIN TRIGGER)\
     **************************************/\
    setInterval(() => \{\
        const chassisNo = getChassisNo();\
        const regNo = getRegistrationNo();\
\
        if (!chassisNo && !regNo) return;\
\
        const vehicleKey = chassisNo || regNo;\
\
        if (vehicleKey !== lastVehicleKey) \{\
            lastVehicleKey = vehicleKey;\
            dismissed = false;\
            showPopup = false;\
            insuranceInfo = null;\
            removePopup();\
\
            fetchInsuranceStatus(chassisNo).then(data => \{\
                if (!data || !data.showPopup || data.expiryDays > MAX_THRESHOLD_DAYS) \{\
                    showPopup = false;\
                    removePopup();\
                    return;\
                \}\
\
                insuranceInfo = \{\
                    expiryDate: data.expiryDate,\
                    expiryDays: data.expiryDays,\
                    urgency: data.urgency,\
                    renewalType: data.renewalType || "UNKNOWN"\
                \};\
\
                showPopup = true;\
            \});\
        \}\
    \}, 1200);\
\
    /**************************************\
     * POPUP PERSISTENCE LOOP\
     **************************************/\
    setInterval(() => \{\
        if (showPopup && !dismissed) \{\
            renderPopup();\
        \} else \{\
            removePopup();\
        \}\
    \}, 1500);\
\
\})();}