const STORAGE_KEY = "rokaf_ax_applications";

const readApplications = () => JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
const saveApplications = (items) => localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
const onlyDigits = (value) => value.replace(/\D/g, "");

function setupForm() {
  const form = document.querySelector("#applicationForm");
  if (!form) return;
  const status = document.querySelector("#formStatus");
  form.businessNumber.addEventListener("input", () => {
    form.businessNumber.value = onlyDigits(form.businessNumber.value);
  });
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const applications = readApplications();
    const selectedProjects = [...form.querySelectorAll("input[name='projects']:checked")].map((item) => item.value);
    const businessNumber = onlyDigits(form.businessNumber.value);
    if (!/^\d{10}$/.test(businessNumber)) {
      status.textContent = "사업자등록번호는 숫자 10자리로 입력해 주세요.";
      form.businessNumber.focus();
      return;
    }
    if (applications.some((item) => item.businessNumber === businessNumber)) {
      status.textContent = "이미 신청된 사업자등록번호입니다.";
      form.businessNumber.focus();
      return;
    }
    if (selectedProjects.length === 0) {
      status.textContent = "관심 연구과제를 1개 이상 선택해 주세요.";
      return;
    }

    applications.push({
      id: crypto.randomUUID(),
      companyName: form.companyName.value.trim(),
      businessNumber,
      attendee1Name: form.attendee1Name.value.trim(),
      attendee1Role: form.attendee1Role.value.trim(),
      attendee1Email: form.attendee1Email.value.trim(),
      attendee1Phone: form.attendee1Phone.value.trim(),
      attendee2Name: form.attendee2Name.value.trim(),
      attendee2Role: form.attendee2Role.value.trim(),
      projects: selectedProjects,
      meetup: form.meetup.value,
      createdAt: new Date().toISOString()
    });
    saveApplications(applications);
    form.reset();
    status.textContent = "[신청완료] 접수가 완료되었습니다. 입력하신 이메일로 안내 메일을 발송하는 백엔드 연동 지점까지 준비되어 있습니다.";
  });
}

function setupTabs() {
  const tabs = document.querySelectorAll(".tab");
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((item) => item.classList.remove("active"));
      document.querySelectorAll(".tab-panel").forEach((item) => item.classList.remove("active"));
      tab.classList.add("active");
      document.getElementById(tab.dataset.tab).classList.add("active");
    });
  });
}

function setupReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) entry.target.classList.add("visible");
    });
  }, { threshold: 0.14 });
  document.querySelectorAll(".reveal").forEach((item) => observer.observe(item));
}

setupReveal();
setupTabs();
setupForm();
