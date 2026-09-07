# Stakeholder Needs, Operational Assumptions & Decision Framework

This document outlines the core operational assumptions, stakeholder profiles, pain points, and decision boundaries governing the **Dairy Cold-Chain Sensor Gap Reconstruction & Handover Confidence System**.

---

## 1. Stakeholder Matrix

| Stakeholder Persona | Primary Operational Needs | Critical Pain Points | Decisions Supported by the Prototype | Key Assumptions |
|---|---|---|---|---|
| **Dairy Operations Manager** | Real-time visibility into collection routes; clear handover status; quick identification of anomalous milk transfers. | Sensor blackouts during rural handovers create blind spots; uncertain milk quality leads to disputed rejections at chilling centers. | Accept, flag for lab testing, or reject milk batch upon tanker arrival based on uncertain exposure duration. | Producers adhere to standard suction hose procedures; vehicle arrivals correspond to GPS proximity. |
| **Quality Assurance (QA) Manager** | Tamper-proof provenance; verification that temperature remained $\le 8.0^\circ\text{C}$; auditable records for regulatory compliance (FSSAI/FDA). | Unverifiable gaps in sensor telemetry; inability to prove whether milk heated up during pump transfers. | Certify batch safety; authorize milk blending into bulk silos; issue formal non-conformance reports. | Sensor calibration drift occurs predictably; door openings correlate directly with thermal ingress risk. |
| **Fleet & Transport Manager** | Tanker refrigeration unit status; cellular connectivity health; tracking driver route delays and transit durations. | Intermittent 2G/3G/4G coverage in rural collection zones; unnotified sensor hardware detachments. | Schedule refrigeration maintenance; recalibrate telemetry units; re-route tankers during road blockages. | Tanker insulation maintains $R$-value specifications; drivers close doors promptly after pumping completes. |
| **Collection Centre Operator** | Quick, intuitive interface to record manual temperature if sensor is offline; zero sync delays when network recovers. | Clunky ERP interfaces; losing offline paper logs when network drops; fear of being blamed for sensor malfunctions. | Enter manual dial thermometer readings during sensor dropouts; confirm handover completion. | Operator possesses a calibrated handheld bimetallic or digital probe as an operational backup. |
| **Cold-Chain Data Analyst** | Access to raw vs. reconstructed telemetry; statistical validation of interpolation models; threshold tuning analytics. | Black-box ML models that cannot be explained to food safety auditors; lack of ground-truth evaluation metrics. | Tune alert thresholds ($7.5^\circ\text{C}$ vs $8.0^\circ\text{C}$ vs $8.5^\circ\text{C}$); evaluate MAE/RMSE across gap lengths. | Synthetic datasets realistically approximate thermodynamic heat transfer and diurnal weather cycles. |

---

## 2. Physical & Domain Assumptions

1. **Thermal Physics**:
   - Liquid milk in bulk insulated tanks has significant thermal inertia (specific heat capacity $c_p \approx 3.93\text{ kJ}/(\text{kg}\cdot^\circ\text{C})$).
   - Rapid temperature jumps ($>3.0^\circ\text{C}/\text{min}$) when vehicle doors are closed are physical impossibilities and represent electrical sensor noise spikes.
   - When tanker doors/hatches are opened for hose attachment in $25^\circ\text{C}$–$32^\circ\text{C}$ ambient air, convective heat gain occurs at an empirical rate of $0.08^\circ\text{C}$–$0.14^\circ\text{C}$ per minute.
2. **Cold-Chain Safety Standards**:
   - Normal safe milk temperature: $2.0^\circ\text{C} - 8.0^\circ\text{C}$.
   - Warning boundary: $8.0^\circ\text{C} - 10.0^\circ\text{C}$ (microbial growth begins to accelerate if sustained $>30$ mins).
   - Critical hazard boundary: $> 10.0^\circ\text{C}$ (risk of acidification, souring, and curdling).
3. **Connectivity & IoT Behavior**:
   - Cellular dead zones in valley routes last between 5 and 25 minutes.
   - Onboard edge hardware contains non-volatile storage capable of buffering at least 48 hours of telemetry records (store-and-forward principle).
   - GPS satellite lock may be obscured near corrugated steel barn roofs or deep hilly terrain.
