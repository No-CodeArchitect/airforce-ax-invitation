const onlyDigits = (value) => value.replace(/\D/g, "");

function formatPhone(value) {
  const digits = onlyDigits(value).slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}

function openCompletionModal(type = 'success', customMessage = '') {
  const modal = document.querySelector('#completionModal');
  const card = modal.querySelector('.completion-card');
  const icon = document.querySelector('#completionIcon');
  const eyebrow = document.querySelector('#completionEyebrow');
  const title = document.querySelector('#completionTitle');
  const message = document.querySelector('#completionMessage');

  const isClosed = type === 'closed';
  const isValidation = type === 'validation';
  card.classList.toggle('is-closed', isClosed);
  card.classList.toggle('is-validation', isValidation);
  icon.textContent = isClosed || isValidation ? '!' : '✓';
  eyebrow.textContent = isClosed ? 'Application Closed' : isValidation ? 'Required Fields' : 'Application Complete';
  title.textContent = isClosed
    ? '신청 접수가 마감되었습니다.'
    : isValidation
      ? '필수 항목을 확인해 주세요.'
      : '신청이 완료되었습니다.';
  message.innerHTML = isClosed
    ? '많은 관심을 보내주셔서 진심으로 감사드립니다.<br>준비된 접수 인원이 모두 마감되어 더 이상 신청을 받기 어려운 점 양해 부탁드립니다.'
    : isValidation
      ? customMessage
      : '행사 참가 신청이 정상적으로 접수되었습니다.<br>입력하신 연락처를 통해 추후 안내드리겠습니다.';
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
  const validateForm = () => {
    const selectedProjects = [...form.querySelectorAll("input[name='projects']:checked")].map((item) => item.value);
    const missing = [];
    const firstInvalid = form.querySelector(":invalid");

    if (!form.companyName.value.trim()) missing.push("기업명");
    if (!form.attendee1Name.value.trim()) missing.push("신청자 성명");
    if (!form.attendee1Role.value.trim()) missing.push("직책");
    if (!form.attendee1Email.value.trim()) missing.push("이메일");
    if (!form.attendee1Phone.value.trim()) missing.push("휴대전화");
    if (selectedProjects.length === 0) missing.push("관심 연구과제");
    if (!form.querySelector("input[name='meetup']:checked")) missing.push("1:1 Meet-Up 참여 여부");
    if (!form.consent.checked) missing.push("개인정보 수집 및 활용 동의");

    if (!missing.length) return { valid: true, selectedProjects };

    const message = `다음 필수 항목을 입력 또는 선택해 주세요.<br>${missing.map((item) => `- ${item}`).join("<br>")}`;
    return { valid: false, message, selectedProjects, firstInvalid };
  };

  form.attendee1Phone.addEventListener("input", () => {
    form.attendee1Phone.value = formatPhone(form.attendee1Phone.value);
  });
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const submitButton = form.querySelector('button[type="submit"]');
    const validation = validateForm();
    if (!validation.valid) {
      status.textContent = "";
      openCompletionModal('validation', validation.message);
      if (validation.firstInvalid) {
        validation.firstInvalid.focus();
      } else {
        const firstProject = form.querySelector("input[name='projects']");
        const firstMeetup = form.querySelector("input[name='meetup']");
        const consent = form.consent;
        if (!validation.selectedProjects.length && firstProject) firstProject.focus();
        else if (!form.querySelector("input[name='meetup']:checked") && firstMeetup) firstMeetup.focus();
        else if (!form.consent.checked && consent) consent.focus();
      }
      return;
    }
    const selectedProjects = validation.selectedProjects;

    const application = {
      companyName: form.companyName.value.trim(),
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
      if (response.status === 429 && result.code === 'APPLICATION_CLOSED') {
        openCompletionModal('closed');
        return;
      }
      if (!response.ok) throw new Error(result.error || '접수에 실패했습니다.');
      form.reset();
      status.textContent = "";
      openCompletionModal('success');
    } catch (error) {
      status.textContent = error.message;
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = "신청서 제출";
    }
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
setupCompletionModal();
setupForm();
