const pptxgen = require("pptxgenjs");
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const sharp = require("sharp");
const {
  FaUserShield, FaIdCard, FaUsers, FaCalendarCheck, FaCalendarPlus, FaVideo,
  FaMicrophone, FaProjectDiagram, FaFileUpload, FaEye, FaShareAlt,
  FaFileSignature, FaWallet, FaArrowCircleDown, FaArrowCircleUp, FaExchangeAlt,
  FaLock, FaKey, FaShieldAlt, FaFilter, FaUserLock, FaServer, FaCheckCircle,
  FaComments, FaPlug, FaHandshake, FaSignOutAlt, FaSlidersH
} = require("react-icons/fa");

// ---- palette: "Midnight Executive" with mint accent ----
const NAVY = "1E2761";
const NAVY2 = "27347D";
const ICE = "CADCFC";
const MINT = "02C39A";
const BG = "F7F9FC";
const TEXT = "1F2937";
const MUTED = "64748B";
const WHITE = "FFFFFF";
const AMBER = "F59E0B";
const RED = "E11D48";

const HEAD = "Trebuchet MS";
const BODY = "Calibri";

function renderIconSvg(IconComponent, color, size = 256) {
  return ReactDOMServer.renderToStaticMarkup(
    React.createElement(IconComponent, { color, size: String(size) })
  );
}

async function iconPng(IconComponent, color) {
  const svg = renderIconSvg(IconComponent, "#" + color, 256);
  const buf = await sharp(Buffer.from(svg)).png().toBuffer();
  return "image/png;base64," + buf.toString("base64");
}

const shadow = () => ({ type: "outer", color: "1E2761", blur: 7, offset: 2, angle: 135, opacity: 0.14 });

(async () => {
  // pre-render all icons
  const I = {
    userShield: await iconPng(FaUserShield, WHITE),
    userShieldNavy: await iconPng(FaUserShield, NAVY),
    idCard: await iconPng(FaIdCard, WHITE),
    users: await iconPng(FaUsers, WHITE),
    calCheck: await iconPng(FaCalendarCheck, WHITE),
    calCheckNavy: await iconPng(FaCalendarCheck, NAVY),
    calPlus: await iconPng(FaCalendarPlus, WHITE),
    video: await iconPng(FaVideo, WHITE),
    videoNavy: await iconPng(FaVideo, NAVY),
    mic: await iconPng(FaMicrophone, WHITE),
    mesh: await iconPng(FaProjectDiagram, WHITE),
    upload: await iconPng(FaFileUpload, WHITE),
    uploadNavy: await iconPng(FaFileUpload, NAVY),
    eye: await iconPng(FaEye, NAVY),
    share: await iconPng(FaShareAlt, NAVY),
    fileSig: await iconPng(FaFileSignature, WHITE),
    fileSigNavy: await iconPng(FaFileSignature, NAVY),
    wallet: await iconPng(FaWallet, WHITE),
    walletNavy: await iconPng(FaWallet, NAVY),
    arrDown: await iconPng(FaArrowCircleDown, WHITE),
    arrUp: await iconPng(FaArrowCircleUp, WHITE),
    exchange: await iconPng(FaExchangeAlt, WHITE),
    lock: await iconPng(FaLock, WHITE),
    key: await iconPng(FaKey, WHITE),
    shield: await iconPng(FaShieldAlt, WHITE),
    filter: await iconPng(FaFilter, WHITE),
    userLock: await iconPng(FaUserLock, WHITE),
    server: await iconPng(FaServer, WHITE),
    check: await iconPng(FaCheckCircle, MINT),
    comments: await iconPng(FaComments, WHITE),
    commentsNavy: await iconPng(FaComments, NAVY),
    plug: await iconPng(FaPlug, WHITE),
    handshake: await iconPng(FaHandshake, MINT),
    signOut: await iconPng(FaSignOutAlt, WHITE),
    sliders: await iconPng(FaSlidersH, WHITE)
  };

  const pres = new pptxgen();
  pres.layout = "LAYOUT_16x9";
  pres.author = "Nexus Internship";
  pres.title = "Nexus - Final Demo Presentation";

  // ---------- helpers ----------
  function lightSlide(kicker, title) {
    const s = pres.addSlide();
    s.background = { color: BG };
    s.addText(kicker.toUpperCase(), {
      x: 0.5, y: 0.28, w: 9, h: 0.28, margin: 0,
      fontFace: HEAD, fontSize: 11, bold: true, color: MINT, charSpacing: 3
    });
    s.addText(title, {
      x: 0.5, y: 0.56, w: 9, h: 0.55, margin: 0,
      fontFace: HEAD, fontSize: 27, bold: true, color: NAVY
    });
    // wordmark footer
    s.addShape(pres.shapes.RECTANGLE, { x: 0.5, y: 5.34, w: 0.12, h: 0.12, fill: { color: MINT } });
    s.addText("NEXUS", {
      x: 0.68, y: 5.27, w: 1.2, h: 0.26, margin: 0,
      fontFace: HEAD, fontSize: 9, bold: true, color: NAVY, charSpacing: 2, valign: "middle"
    });
    return s;
  }

  function iconRow(s, icon, x, y, header, desc, w = 3.7, circle = NAVY) {
    s.addShape(pres.shapes.OVAL, { x, y, w: 0.5, h: 0.5, fill: { color: circle } });
    s.addImage({ data: icon, x: x + 0.13, y: y + 0.13, w: 0.24, h: 0.24 });
    s.addText(header, {
      x: x + 0.7, y: y - 0.04, w, h: 0.32, margin: 0,
      fontFace: HEAD, fontSize: 14, bold: true, color: NAVY
    });
    s.addText(desc, {
      x: x + 0.7, y: y + 0.28, w, h: 0.72, margin: 0,
      fontFace: BODY, fontSize: 11.5, color: MUTED, valign: "top"
    });
  }

  function numChip(s, n, x, y, text, w = 3.3, textColor = WHITE, d = 0.34) {
    s.addShape(pres.shapes.OVAL, { x, y, w: d, h: d, fill: { color: MINT } });
    s.addText(String(n), {
      x, y, w: d, h: d, margin: 0, align: "center", valign: "middle",
      fontFace: HEAD, fontSize: 12, bold: true, color: NAVY
    });
    s.addText(text, {
      x: x + d + 0.15, y: y - 0.05, w, h: d + 0.16, margin: 0, valign: "middle",
      fontFace: BODY, fontSize: 11.5, color: textColor
    });
  }

  // ================= SLIDE 1 : TITLE =================
  {
    const s = pres.addSlide();
    s.background = { color: NAVY };
    // decorative circles, right side
    s.addShape(pres.shapes.OVAL, { x: 7.2, y: -1.2, w: 4.4, h: 4.4, fill: { color: NAVY2 } });
    s.addShape(pres.shapes.OVAL, { x: 8.5, y: 2.9, w: 3.2, h: 3.2, fill: { color: MINT, transparency: 82 } });
    s.addShape(pres.shapes.OVAL, { x: 8.05, y: 0.85, w: 0.9, h: 0.9, fill: { color: MINT } });
    s.addImage({ data: await iconPng(FaHandshake, NAVY), x: 8.25, y: 1.07, w: 0.5, h: 0.46 });

    s.addText("FULL-STACK DEVELOPMENT INTERNSHIP · FINAL DEMO", {
      x: 0.6, y: 1.45, w: 7, h: 0.3, margin: 0,
      fontFace: HEAD, fontSize: 12, bold: true, color: MINT, charSpacing: 3
    });
    s.addText("Nexus", {
      x: 0.6, y: 1.8, w: 7, h: 1.1, margin: 0,
      fontFace: HEAD, fontSize: 60, bold: true, color: WHITE
    });
    s.addText("Investor & Entrepreneur Collaboration Platform", {
      x: 0.6, y: 3.0, w: 6.8, h: 0.45, margin: 0,
      fontFace: BODY, fontSize: 19, color: ICE
    });
    s.addText("Authentication · Meetings · Video Calls · Documents & E-Sign · Payments · Security", {
      x: 0.6, y: 3.55, w: 6.9, h: 0.35, margin: 0,
      fontFace: BODY, fontSize: 12.5, color: ICE, italic: true
    });
    s.addShape(pres.shapes.LINE, { x: 0.6, y: 4.35, w: 2.2, h: 0, line: { color: MINT, width: 2 } });
    s.addText("June 2026  ·  React + Express + MongoDB + Socket.IO", {
      x: 0.6, y: 4.5, w: 6.5, h: 0.3, margin: 0,
      fontFace: BODY, fontSize: 11.5, color: ICE
    });
  }

  // ================= SLIDE 2 : AT A GLANCE =================
  {
    const s = lightSlide("Project overview", "From Mock-Data Frontend to Full Platform");
    s.addText(
      "Nexus started as a React UI running entirely on hard-coded data. Over three weeks it gained a complete Node.js backend, a real database, and six fully integrated modules.",
      { x: 0.5, y: 1.18, w: 9, h: 0.55, margin: 0, fontFace: BODY, fontSize: 12.5, color: TEXT }
    );

    const stats = [
      ["6", "integrated modules"],
      ["25+", "REST endpoints"],
      ["11", "Socket.IO events"],
      ["2", "user roles"]
    ];
    stats.forEach(([num, label], i) => {
      const x = 0.5 + i * 2.3;
      s.addShape(pres.shapes.RECTANGLE, { x, y: 1.85, w: 2.1, h: 1.3, fill: { color: WHITE }, shadow: shadow() });
      s.addShape(pres.shapes.RECTANGLE, { x, y: 1.85, w: 2.1, h: 0.07, fill: { color: MINT } });
      s.addText(num, {
        x, y: 2.0, w: 2.1, h: 0.65, margin: 0, align: "center",
        fontFace: HEAD, fontSize: 38, bold: true, color: NAVY
      });
      s.addText(label, {
        x, y: 2.68, w: 2.1, h: 0.3, margin: 0, align: "center",
        fontFace: BODY, fontSize: 11, color: MUTED
      });
    });

    s.addText("The six modules", {
      x: 0.5, y: 3.45, w: 9, h: 0.3, margin: 0,
      fontFace: HEAD, fontSize: 13, bold: true, color: NAVY
    });
    const modules = [
      [I.userShield, "Auth & Profiles"],
      [I.comments, "Real-time Chat"],
      [I.calCheck, "Meetings"],
      [I.video, "Video Calls"],
      [I.fileSig, "Documents"],
      [I.wallet, "Payments"]
    ];
    modules.forEach(([icon, label], i) => {
      const cellX = 0.5 + i * 1.5;
      s.addShape(pres.shapes.OVAL, { x: cellX + 0.475, y: 3.85, w: 0.55, h: 0.55, fill: { color: NAVY } });
      s.addImage({ data: icon, x: cellX + 0.62, y: 3.995, w: 0.26, h: 0.26 });
      s.addText(label, {
        x: cellX, y: 4.48, w: 1.5, h: 0.3, margin: 0, align: "center",
        fontFace: BODY, fontSize: 10.5, color: TEXT
      });
    });
  }

  // ================= SLIDE 3 : ARCHITECTURE =================
  {
    const s = lightSlide("System design", "Architecture");
    s.addText([
      { text: "Typed service layer. ", options: { bold: true, color: NAVY } },
      { text: "Every page talks to the API through axios services with a JWT interceptor — no mock data remains.", options: { color: TEXT, breakLine: true } },
      { text: "", options: { breakLine: true } },
      { text: "One token, two transports. ", options: { bold: true, color: NAVY } },
      { text: "The same JWT authenticates REST calls and the Socket.IO connection used for chat, presence, and call signaling.", options: { color: TEXT, breakLine: true } },
      { text: "", options: { breakLine: true } },
      { text: "Zero-setup development. ", options: { bold: true, color: NAVY } },
      { text: "Without MONGODB_URI the server boots an in-memory MongoDB and auto-seeds demo users — clone and run.", options: { color: TEXT } }
    ], { x: 0.5, y: 1.35, w: 4.35, h: 3.5, margin: 0, fontFace: BODY, fontSize: 12.5, valign: "top" });

    // stack diagram
    const boxes = [
      ["React 18 · Vite · TypeScript · Tailwind", "Frontend — deployed on Vercel", NAVY, WHITE, ICE],
      ["Express 4 REST API + Socket.IO", "Backend — deployed on Render", MINT, NAVY, NAVY],
      ["MongoDB via Mongoose 8", "Database — MongoDB Atlas", ICE, NAVY, NAVY2]
    ];
    boxes.forEach(([main, sub, fill, mainColor, subColor], i) => {
      const y = 1.4 + i * 1.25;
      s.addShape(pres.shapes.RECTANGLE, { x: 5.35, y, w: 4.15, h: 0.92, fill: { color: fill }, shadow: shadow() });
      s.addText(main, {
        x: 5.6, y: y + 0.12, w: 3.7, h: 0.35, margin: 0,
        fontFace: HEAD, fontSize: 13.5, bold: true, color: mainColor
      });
      s.addText(sub, {
        x: 5.6, y: y + 0.49, w: 3.7, h: 0.3, margin: 0,
        fontFace: BODY, fontSize: 10.5, color: subColor
      });
      if (i < 2) {
        s.addText("▼", {
          x: 7.25, y: y + 0.94, w: 0.35, h: 0.31, margin: 0, align: "center", valign: "middle",
          fontFace: BODY, fontSize: 12, color: MUTED
        });
      }
    });
    s.addText("HTTPS · JSON  +  WebSocket", {
      x: 5.35, y: 5.0, w: 4.15, h: 0.28, margin: 0, align: "center",
      fontFace: BODY, fontSize: 10, italic: true, color: MUTED
    });
  }

  // ================= SLIDE 4 : AUTH & PROFILES =================
  {
    const s = lightSlide("Week 1", "Authentication & Profiles");
    iconRow(s, I.key, 0.5, 1.45, "JWT + bcrypt",
      "Stateless 7-day tokens; passwords hashed with 12 rounds and never serialized in responses.");
    iconRow(s, I.users, 0.5, 2.6, "Role-based experience",
      "Investors and entrepreneurs get separate dashboards, navigation, and permissions.");
    iconRow(s, I.idCard, 0.5, 3.75, "Rich profiles in MongoDB",
      "Startup pitch, funding ask, industry, team size — or investment interests, stages, and ticket range.");

    // 2FA flow card
    s.addShape(pres.shapes.RECTANGLE, { x: 5.3, y: 1.4, w: 4.2, h: 3.5, fill: { color: NAVY }, shadow: shadow() });
    s.addText("Two-factor login flow", {
      x: 5.6, y: 1.62, w: 3.6, h: 0.32, margin: 0,
      fontFace: HEAD, fontSize: 14.5, bold: true, color: WHITE
    });
    numChip(s, 1, 5.6, 2.15, "Email + password verified against bcrypt hash");
    numChip(s, 2, 5.6, 2.83, "6-digit OTP emailed (hashed server-side, 10-min expiry)");
    numChip(s, 3, 5.6, 3.51, "Code verified → JWT issued → role dashboard");
    s.addText("Optional per account — toggled from Settings", {
      x: 5.6, y: 4.35, w: 3.6, h: 0.3, margin: 0,
      fontFace: BODY, fontSize: 10, italic: true, color: ICE
    });
  }

  // ================= SLIDE 5 : MEETINGS =================
  {
    const s = lightSlide("Week 2", "Meeting Scheduling");
    iconRow(s, I.calPlus, 0.5, 1.45, "Schedule with anyone",
      "Pick a contact, title, agenda, date and time — invites land as pending meetings.");
    iconRow(s, I.calCheck, 0.5, 2.6, "Accept · decline · cancel",
      "Invitees respond, organizers cancel; every state change is stored and re-validated.");
    iconRow(s, I.video, 0.5, 3.75, "One click to the call",
      "Accepted meetings carry a private room id — Join Call opens the video room.");

    // conflict card
    s.addShape(pres.shapes.RECTANGLE, { x: 5.3, y: 1.4, w: 4.2, h: 3.5, fill: { color: NAVY }, shadow: shadow() });
    s.addText("409", {
      x: 5.3, y: 1.62, w: 4.2, h: 0.95, margin: 0, align: "center",
      fontFace: HEAD, fontSize: 54, bold: true, color: MINT
    });
    s.addText("Double-booking? Rejected.", {
      x: 5.3, y: 2.72, w: 4.2, h: 0.35, margin: 0, align: "center",
      fontFace: HEAD, fontSize: 15, bold: true, color: WHITE
    });
    s.addText(
      "Overlap detection runs for both participants at scheduling time — and again when an invite is accepted, in case the calendar changed in between.",
      { x: 5.65, y: 3.15, w: 3.5, h: 1.3, margin: 0, align: "center", fontFace: BODY, fontSize: 11.5, color: ICE, valign: "top" }
    );
  }

  // ================= SLIDE 6 : VIDEO =================
  {
    const s = lightSlide("Week 2", "Video Calling — WebRTC");
    iconRow(s, I.video, 0.5, 1.45, "Peer-to-peer media",
      "Camera and mic stream directly between browsers; the server only relays signaling.");
    iconRow(s, I.sliders, 0.5, 2.6, "In-call controls",
      "Toggle audio/video (peers are notified), copy an invite link, end the call.");
    iconRow(s, I.mesh, 0.5, 3.75, "Multi-peer mesh",
      "Existing peers send offers to each newcomer — works for 1:1 and small groups.");

    // signaling card
    s.addShape(pres.shapes.RECTANGLE, { x: 5.3, y: 1.4, w: 4.2, h: 3.6, fill: { color: WHITE }, shadow: shadow() });
    s.addShape(pres.shapes.RECTANGLE, { x: 5.3, y: 1.4, w: 0.08, h: 3.6, fill: { color: MINT } });
    s.addText("Signaling over Socket.IO", {
      x: 5.62, y: 1.58, w: 3.6, h: 0.32, margin: 0,
      fontFace: HEAD, fontSize: 14, bold: true, color: NAVY
    });
    const steps = [
      "video:join-room — authenticated by JWT",
      "video:user-joined → peers create offers",
      "offer / answer exchanged via server relay",
      "ICE candidates trickle to each target peer",
      "media flows P2P (STUN: Google public)"
    ];
    steps.forEach((t, i) => numChip(s, i + 1, 5.62, 2.05 + i * 0.57, t, 3.45, TEXT, 0.32));
  }

  // ================= SLIDE 7 : DOCUMENTS =================
  {
    const s = lightSlide("Week 2", "Document Chamber & E-Signature");
    const flow = [
      [I.uploadNavy, "Upload", "Drag & drop or browse — 10 MB cap, MIME whitelist"],
      [I.eye, "Preview", "PDFs and images render inline from the authenticated API"],
      [I.share, "Share", "Grant access to any investor or entrepreneur"],
      [I.fileSigNavy, "E-Sign", "Draw on a canvas pad — stored as image + signer + time"]
    ];
    flow.forEach(([icon, label, desc], i) => {
      const cellX = 0.5 + i * 2.33;
      s.addShape(pres.shapes.OVAL, { x: cellX + 0.65, y: 1.45, w: 0.7, h: 0.7, fill: { color: ICE } });
      s.addImage({ data: icon, x: cellX + 0.83, y: 1.63, w: 0.34, h: 0.34 });
      s.addText(label, {
        x: cellX, y: 2.25, w: 2.0, h: 0.32, margin: 0, align: "center",
        fontFace: HEAD, fontSize: 14, bold: true, color: NAVY
      });
      s.addText(desc, {
        x: cellX, y: 2.57, w: 2.0, h: 0.75, margin: 0, align: "center",
        fontFace: BODY, fontSize: 10, color: MUTED, valign: "top"
      });
      if (i < 3) {
        s.addText("→", {
          x: cellX + 2.0, y: 1.62, w: 0.33, h: 0.36, margin: 0, align: "center", valign: "middle",
          fontFace: BODY, fontSize: 16, bold: true, color: MINT
        });
      }
    });

    // metadata card
    s.addShape(pres.shapes.RECTANGLE, { x: 0.5, y: 3.55, w: 9, h: 1.45, fill: { color: WHITE }, shadow: shadow() });
    s.addShape(pres.shapes.RECTANGLE, { x: 0.5, y: 3.55, w: 0.08, h: 1.45, fill: { color: MINT } });
    s.addText("Tracked on every document", {
      x: 0.8, y: 3.7, w: 5.5, h: 0.3, margin: 0,
      fontFace: HEAD, fontSize: 13, bold: true, color: NAVY
    });
    s.addText("Owner · original name · MIME type · size · version · shared-with list · every signature (image, signer, timestamp)", {
      x: 0.8, y: 4.02, w: 5.3, h: 0.75, margin: 0,
      fontFace: BODY, fontSize: 11, color: MUTED, valign: "top"
    });
    const chips = [["draft", MUTED], ["in review", AMBER], ["final", NAVY], ["signed", MINT]];
    chips.forEach(([label, color], i) => {
      const cx = 6.35 + (i % 2) * 1.55, cy = 3.83 + Math.floor(i / 2) * 0.55;
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: cx, y: cy, w: 1.4, h: 0.4, fill: { color }, rectRadius: 0.2 });
      s.addText(label, {
        x: cx, y: cy, w: 1.4, h: 0.4, margin: 0, align: "center", valign: "middle",
        fontFace: HEAD, fontSize: 10.5, bold: true, color: WHITE
      });
    });
  }

  // ================= SLIDE 8 : PAYMENTS =================
  {
    const s = lightSlide("Week 3", "Payments — Sandbox Wallet");
    // wallet card
    s.addShape(pres.shapes.RECTANGLE, { x: 0.5, y: 1.4, w: 3.9, h: 3.37, fill: { color: NAVY }, shadow: shadow() });
    s.addText("AVAILABLE BALANCE", {
      x: 0.8, y: 1.72, w: 3.3, h: 0.26, margin: 0,
      fontFace: HEAD, fontSize: 10, bold: true, color: ICE, charSpacing: 2
    });
    s.addText("$10,000.00", {
      x: 0.8, y: 2.02, w: 3.3, h: 0.7, margin: 0,
      fontFace: HEAD, fontSize: 36, bold: true, color: WHITE
    });
    s.addText("every new account starts funded — mock USD", {
      x: 0.8, y: 2.78, w: 3.3, h: 0.3, margin: 0,
      fontFace: BODY, fontSize: 10.5, italic: true, color: ICE
    });
    s.addShape(pres.shapes.LINE, { x: 0.8, y: 3.3, w: 3.3, h: 0, line: { color: MINT, width: 1.5 } });
    s.addText([
      { text: "Stripe-style txn_… references", options: { breakLine: true } },
      { text: "Atomic two-sided transfers", options: { breakLine: true } },
      { text: "Full history in the dashboard" }
    ], {
      x: 0.8, y: 3.5, w: 3.3, h: 1.1, margin: 0, valign: "top",
      fontFace: BODY, fontSize: 11.5, color: ICE, bullet: false, paraSpaceAfter: 6
    });

    iconRow(s, I.arrDown, 4.9, 1.45, "Deposit", "Simulated card charge — always completes in sandbox mode.", 4.0, MINT);
    iconRow(s, I.arrUp, 4.9, 2.4, "Withdraw", "Balance-checked; failures are still recorded with a reason.", 4.0, NAVY);
    iconRow(s, I.exchange, 4.9, 3.35, "Transfer", "Move funds to any user — sender and recipient each get a record.", 4.0, NAVY);

    s.addText("Every attempt is stored:", {
      x: 4.9, y: 4.42, w: 2.2, h: 0.35, margin: 0, valign: "middle",
      fontFace: HEAD, fontSize: 11.5, bold: true, color: NAVY
    });
    const statuses = [["pending", AMBER], ["completed", MINT], ["failed", RED]];
    statuses.forEach(([label, color], i) => {
      const cx = 7.0 + i * 0.92;
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: cx, y: 4.42, w: 0.85, h: 0.35, fill: { color }, rectRadius: 0.17 });
      s.addText(label, {
        x: cx, y: 4.42, w: 0.85, h: 0.35, margin: 0, align: "center", valign: "middle",
        fontFace: HEAD, fontSize: 8.5, bold: true, color: WHITE
      });
    });
  }

  // ================= SLIDE 9 : SECURITY =================
  {
    const s = lightSlide("Week 3", "Security, Layer by Layer");
    const cards = [
      [I.lock, "Bcrypt hashing", "12-round hashes; password and OTP fields excluded from every API response."],
      [I.key, "JWT everywhere", "Signed 7-day tokens guard REST routes and the Socket.IO handshake alike."],
      [I.shield, "Email OTP 2FA", "Optional second factor; codes hashed server-side and expired after 10 minutes."],
      [I.filter, "Validation & sanitization", "express-validator escapes XSS payloads; mongo-sanitize blocks NoSQL injection."],
      [I.userLock, "Role-based access", "Investors request, entrepreneurs respond, owners share — enforced in middleware."],
      [I.server, "Hardened HTTP", "Helmet headers, CORS allowlist, rate limits: 50/15 min auth, 500/15 min API."]
    ];
    cards.forEach(([icon, title, desc], i) => {
      const x = 0.5 + (i % 3) * 3.07, y = 1.4 + Math.floor(i / 3) * 1.85;
      s.addShape(pres.shapes.RECTANGLE, { x, y, w: 2.86, h: 1.66, fill: { color: WHITE }, shadow: shadow() });
      s.addShape(pres.shapes.OVAL, { x: x + 0.22, y: y + 0.18, w: 0.44, h: 0.44, fill: { color: NAVY } });
      s.addImage({ data: icon, x: x + 0.33, y: y + 0.29, w: 0.22, h: 0.22 });
      s.addText(title, {
        x: x + 0.78, y: y + 0.2, w: 2.0, h: 0.42, margin: 0, valign: "middle",
        fontFace: HEAD, fontSize: 12.5, bold: true, color: NAVY
      });
      s.addText(desc, {
        x: x + 0.22, y: y + 0.74, w: 2.45, h: 0.85, margin: 0, valign: "top",
        fontFace: BODY, fontSize: 10, color: MUTED
      });
    });
  }

  // ================= SLIDE 10 : DEMO FLOW =================
  {
    const s = lightSlide("Live walkthrough", "Demo Flow");
    const left = [
      "Register a new investor — JWT issued, role routing to the investor dashboard",
      "Browse startups, open Sarah's profile, send a collaboration request",
      "As Sarah: accept the request, then chat — messages arrive in real time",
      "Schedule a meeting; try double-booking the slot and watch the 409 toast"
    ];
    const right = [
      "As Michael: accept the invite, Join Call, toggle mic and camera, end call",
      "Upload a PDF, preview it inline, share it, draw an e-signature",
      "Deposit, transfer, and force a failed withdrawal — then enable 2FA and log in with the OTP"
    ];
    left.forEach((t, i) => {
      const y = 1.4 + i * 0.88;
      s.addShape(pres.shapes.OVAL, { x: 0.5, y, w: 0.42, h: 0.42, fill: { color: NAVY } });
      s.addText(String(i + 1), {
        x: 0.5, y, w: 0.42, h: 0.42, margin: 0, align: "center", valign: "middle",
        fontFace: HEAD, fontSize: 14, bold: true, color: WHITE
      });
      s.addText(t, {
        x: 1.1, y: y - 0.12, w: 3.55, h: 0.85, margin: 0, valign: "middle",
        fontFace: BODY, fontSize: 11.5, color: TEXT
      });
    });
    right.forEach((t, i) => {
      const y = 1.4 + i * 0.88;
      s.addShape(pres.shapes.OVAL, { x: 5.2, y, w: 0.42, h: 0.42, fill: { color: NAVY } });
      s.addText(String(i + 5), {
        x: 5.2, y, w: 0.42, h: 0.42, margin: 0, align: "center", valign: "middle",
        fontFace: HEAD, fontSize: 14, bold: true, color: WHITE
      });
      s.addText(t, {
        x: 5.8, y: y - 0.12, w: 3.6, h: 0.85, margin: 0, valign: "middle",
        fontFace: BODY, fontSize: 11.5, color: TEXT
      });
    });
    // demo creds strip
    s.addShape(pres.shapes.RECTANGLE, { x: 5.2, y: 4.18, w: 4.3, h: 0.78, fill: { color: NAVY }, shadow: shadow() });
    s.addText([
      { text: "Demo accounts  ", options: { bold: true, color: MINT } },
      { text: "sarah@techwave.io (entrepreneur) · michael@vcinnovate.com (investor) · password123", options: { color: ICE } }
    ], {
      x: 5.45, y: 4.18, w: 3.85, h: 0.78, margin: 0, valign: "middle",
      fontFace: BODY, fontSize: 10
    });
  }

  // ================= SLIDE 11 : DELIVERABLES / CLOSING =================
  {
    const s = pres.addSlide();
    s.background = { color: NAVY };
    s.addShape(pres.shapes.OVAL, { x: 8.6, y: -1.4, w: 3.6, h: 3.6, fill: { color: NAVY2 } });
    s.addShape(pres.shapes.OVAL, { x: -1.1, y: 4.2, w: 2.6, h: 2.6, fill: { color: MINT, transparency: 84 } });

    s.addText("EVERYTHING DELIVERED", {
      x: 0.6, y: 0.45, w: 8, h: 0.3, margin: 0,
      fontFace: HEAD, fontSize: 11, bold: true, color: MINT, charSpacing: 3
    });
    s.addText("Final Deliverables", {
      x: 0.6, y: 0.75, w: 8, h: 0.6, margin: 0,
      fontFace: HEAD, fontSize: 30, bold: true, color: WHITE
    });

    const items = [
      "Functional web app — all six modules working end to end",
      "GitHub repository — frontend + backend, clean commit history",
      "API documentation — docs/API.md + Postman collection",
      "Weekly documentation — WEEK1 / WEEK2 / WEEK3 reports",
      "Deployment runbook — Vercel + Render + MongoDB Atlas",
      "This demo presentation with the live walkthrough script"
    ];
    items.forEach((t, i) => {
      const x = 0.6 + (i % 2) * 4.6, y = 1.65 + Math.floor(i / 2) * 0.78;
      s.addImage({ data: I.check, x, y: y + 0.03, w: 0.3, h: 0.3 });
      s.addText(t, {
        x: x + 0.45, y: y - 0.08, w: 3.9, h: 0.62, margin: 0, valign: "middle",
        fontFace: BODY, fontSize: 12, color: ICE
      });
    });

    s.addText("Thank you.", {
      x: 0.6, y: 4.25, w: 6, h: 0.75, margin: 0,
      fontFace: HEAD, fontSize: 38, bold: true, color: WHITE
    });
    s.addText("Branch: full-stack-integration  ·  Run locally: server → npm start, root → npm run dev", {
      x: 0.6, y: 5.05, w: 8.8, h: 0.3, margin: 0,
      fontFace: BODY, fontSize: 11, color: ICE
    });
  }

  await pres.writeFile({ fileName: "Nexus-Demo-Presentation.pptx" });
  console.log("Deck written: Nexus-Demo-Presentation.pptx");
})();
