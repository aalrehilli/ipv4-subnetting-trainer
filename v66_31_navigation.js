/* V66.31 — Navigation & Tabs Reliability Layer
   Keeps the existing platform logic intact and adds a single resilient UI layer
   for page navigation, student dashboard tabs, trainer tabs, and Packet Tracer tabs.
*/
(function(){
  "use strict";

  const qs = (s, root=document) => root.querySelector(s);
  const qsa = (s, root=document) => Array.from(root.querySelectorAll(s));
  const byId = id => document.getElementById(id);

  function activateSection(id, button){
    const app = byId("app");
    if(!app) return false;
    const target = byId(id);
    if(!target) return false;

    qsa("#app > section").forEach(section => {
      section.classList.toggle("hidden", section.id !== id);
      section.setAttribute("aria-hidden", section.id === id ? "false" : "true");
    });

    qsa("nav button").forEach(btn => btn.classList.remove("active"));
    if(button && button.tagName === "BUTTON") button.classList.add("active");

    if(id === "home"){
      try { window.scrollTo({top:0,left:0,behavior:"smooth"}); } catch(_) { window.scrollTo(0,0); }
    } else {
      try { target.scrollIntoView({behavior:"smooth",block:"start"}); } catch(_) {}
    }
    return true;
  }

  // --- Main navigation ---
  const originalPage = window.page;
  window.page = function(id, button){
    try{
      if(typeof originalPage === "function"){
        originalPage(id, button);
      } else {
        activateSection(id, button);
      }
    }catch(error){
      console.error("V66.31 page navigation:", error);
      // Never leave the interface with every section hidden.
      if(!activateSection(id, button)) activateSection("home", null);
      try{
        if(typeof window.v63Toast === "function"){
          window.v63Toast("تعذر تنفيذ الانتقال تلقائيًا؛ تم فتح القسم المطلوب مباشرة.", "warn");
        }
      }catch(_){}
    }

    // The original page() hides/shows sections. Re-apply a deterministic state
    // after async render functions have been scheduled.
    setTimeout(() => {
      if(byId(id)) activateSection(id, button || qsa("nav button").find(b => {
        const oc = b.getAttribute("onclick") || "";
        return oc.includes("page('" + id + "'");
      }));
    }, 0);
  };

  // --- Student dashboard tabs ---
  const originalStudentTab = window.studentDashboardTab;
  const studentTabs = ["overview","progress","review","errors","achievements","notifications","history"];

  function syncStudentTab(tab, button){
    if(!studentTabs.includes(tab)) tab = "overview";
    window.v58DashboardTab = tab;
    studentTabs.forEach(name => {
      const panel = byId("sdPanel-" + name);
      const btn = byId("sdTab-" + name);
      if(panel){
        panel.classList.toggle("active", name === tab);
        panel.setAttribute("aria-hidden", name === tab ? "false" : "true");
      }
      if(btn){
        btn.classList.toggle("active", name === tab);
        btn.setAttribute("aria-selected", name === tab ? "true" : "false");
      }
    });
    const target = byId("sdPanel-" + tab);
    if(target){
      try{ target.scrollIntoView({behavior:"smooth",block:"start"}); }catch(_){}
    }
  }

  window.studentDashboardTab = function(tab, button){
    try{
      if(typeof originalStudentTab === "function") originalStudentTab(tab, button);
    }catch(error){
      console.error("V66.31 student dashboard tab:", error);
    }
    syncStudentTab(tab, button);
  };

  // --- Trainer dashboard tabs ---
  const originalTrainerTab = window.trainerTab;
  const trainerTabs = [
    "overview","students","questions","exams","labs",
    "blueprint","analytics","reports","smartFollow"
  ];
  function trainerPanelId(tab){ return "trainer" + tab.charAt(0).toUpperCase() + tab.slice(1); }

  function syncTrainerTab(tab){
    if(!trainerTabs.includes(tab)) tab = "overview";
    trainerTabs.forEach(name => {
      const panel = byId(trainerPanelId(name));
      if(panel) panel.classList.toggle("hidden", name !== tab);
    });
    qsa(".trainer-dashboard-tabs button").forEach(btn => {
      const oc = btn.getAttribute("onclick") || "";
      const active = oc.includes("trainerTab('" + tab + "'");
      btn.classList.toggle("active", active);
    });
  }

  window.trainerTab = function(tab, button){
    try{
      if(typeof originalTrainerTab === "function") originalTrainerTab(tab, button);
    }catch(error){
      console.error("V66.31 trainer tab:", error);
    }
    syncTrainerTab(tab);
  };

  // --- Packet Tracer exercise tabs ---
  const originalExerciseTab = window.v66SelectExercise;
  function syncExerciseTab(no){
    const n = Number(no) || 1;
    qsa(".v66-exercise-tab").forEach(btn => {
      const active = Number(btn.dataset.exerciseNo) === n;
      btn.classList.toggle("active", active);
      btn.setAttribute("aria-selected", active ? "true" : "false");
    });
    qsa(".v66-exercise-panel").forEach(panel => {
      const active = Number(panel.dataset.exerciseNo) === n;
      panel.classList.toggle("active", active);
      panel.setAttribute("aria-hidden", active ? "false" : "true");
    });
    const pos = byId("v66ExercisePosition");
    const total = Number(window.v66ExerciseTotal || qsa(".v66-exercise-tab").length || 1);
    if(pos) pos.textContent = "تمرين " + n + " من " + total;
  }

  window.v66SelectExercise = function(no){
    try{
      if(typeof originalExerciseTab === "function"){
        originalExerciseTab(no);
      }else{
        syncExerciseTab(no);
      }
    }catch(error){
      console.error("V66.31 exercise tab:", error);
      syncExerciseTab(no);
    }
    setTimeout(() => syncExerciseTab(no), 0);
  };

  // --- Make dynamically created exercise tabs keyboard-accessible and reliable ---
  document.addEventListener("keydown", function(event){
    const tab = event.target?.closest?.(".v66-exercise-tab");
    if(!tab) return;
    if(event.key === "Enter" || event.key === " "){
      event.preventDefault();
      const no = Number(tab.dataset.exerciseNo);
      if(Number.isFinite(no)) window.v66SelectExercise(no);
    }
  });

  // --- Prevent a stale loading message from remaining forever after a successful render ---
  function markLoaded(id){
    const el = byId(id);
    if(!el) return;
    el.dataset.v6631Ready = "true";
  }

  // Wrap known async renderers so a transient exception produces a useful UI state.
  const wrapRenderer = (name, hostIds) => {
    const original = window[name];
    if(typeof original !== "function") return;
    window[name] = async function(){
      try{
        const result = await original.apply(this, arguments);
        hostIds.forEach(markLoaded);
        return result;
      }catch(error){
        console.error("V66.31 " + name + ":", error);
        hostIds.forEach(id => {
          const host = byId(id);
          if(host && !host.dataset.v6631Ready){
            host.innerHTML = '<div class="bad">❌ تعذر تحميل هذا القسم الآن. جرّب تحديث القسم أو الصفحة.</div>';
          }
        });
        try{
          if(typeof window.v63Toast === "function"){
            window.v63Toast("تعذر تحميل أحد مكونات القسم. يمكنك إعادة المحاولة.", "bad");
          }
        }catch(_){}
      }
    };
  };

  // Do not alter the successful response; only add a safe failure surface.
  wrapRenderer("loadPublishedExams", ["publishedTests"]);
  wrapRenderer("v66RenderLabs", ["v66LabsGrid"]);
  wrapRenderer("renderDashboard", ["studentDashboard"]);
  wrapRenderer("renderTrainer", ["trainerOverview"]);

  // Re-apply tab state whenever a render replaces the DOM.
  const observer = new MutationObserver(() => {
    const dashboard = byId("dashboard");
    if(dashboard && !dashboard.classList.contains("hidden")){
      syncStudentTab(window.v58DashboardTab || "overview");
    }
    const labs = byId("packetLabs");
    if(labs && !labs.classList.contains("hidden")){
      const current = Number(window.v66ActiveExerciseNo || 1);
      syncExerciseTab(current);
    }
  });
  observer.observe(document.body, {childList:true,subtree:true});

  // Ensure the app never renders with all top-level sections hidden.
  window.addEventListener("load", () => {
    const sections = qsa("#app > section");
    if(sections.length && !sections.some(s => !s.classList.contains("hidden"))){
      activateSection("home", qsa("nav button").find(b => (b.getAttribute("onclick")||"").includes("page('home'")));
    }
  });
})();
