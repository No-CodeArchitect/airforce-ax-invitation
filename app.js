const onlyDigits = (value) => value.replace(/\D/g, "");

function formatPhone(value) {
  const digits = onlyDigits(value).slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}

function openCompletionModal() {
  const modal = document.querySelector('#completionModal');
  modal.hidden = false;
  document.body.classList.add('modal-open');
  document.querySelector('#completionClose').focus();
}

function setupCompletionModal() {
  const modal = document.querySelector('#completionModal');
  const close = () => {
    modal.hidden = true;
    document.body.classList.remove('modal-open');
  };
  document.querySelector('#completionClose').addEventListener('click', close);
  modal.addEventListener('click', (event) => {
    if (event.target === modal) close();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !modal.hidden) close();
  });
}

function setupForm() {
  const form = document.querySelector("#applicationForm");
  if (!form) return;
  const status = document.querySelector("#formStatus");
  form.businessNumber.addEventListener("input", () => {
    form.businessNumber.value = onlyDigits(form.businessNumber.value);
  });
  form.attendee1Phone.addEventListener("input", () => {
    form.attendee1Phone.value = formatPhone(form.attendee1Phone.value);
  });
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const submitButton = form.querySelector('button[type="submit"]');
    const selectedProjects = [...form.querySelectorAll("input[name='projects']:checked")].map((item) => item.value);
    const businessNumber = onlyDigits(form.businessNumber.value);
    if (!/^\d{10}$/.test(businessNumber)) {
      status.textContent = "사업자등록번호는 숫자 10자리로 입력해 주세요.";
      form.businessNumber.focus();
      return;
    }
    if (selectedProjects.length === 0) {
      status.textContent = "관심 연구과제를 1개 이상 선택해 주세요.";
      return;
    }

    const application = {
      companyName: form.companyName.value.trim(),
      businessNumber,
      attendee1Name: form.attendee1Name.value.trim(),
      attendee1Role: form.attendee1Role.value.trim(),
      attendee1Email: form.attendee1Email.value.trim(),
      attendee1Phone: form.attendee1Phone.value.trim(),
      attendee2Name: form.attendee2Name.value.trim(),
      attendee2Role: form.attendee2Role.value.trim(),
      projects: selectedProjects,
      meetup: form.meetup.value
    };

    submitButton.disabled = true;
    submitButton.textContent = "접수 중...";
    status.textContent = "";
    try {
      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(application)
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || '접수에 실패했습니다.');
      form.reset();
      status.textContent = "";
      openCompletionModal();
    } catch (error) {
      status.textContent = error.message;
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = "신청서 제출";
    }
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
setupCompletionModal();
setupForm();
