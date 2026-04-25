(function () {
  var header = document.querySelector("[data-header]");
  var menuToggle = document.querySelector("[data-menu-toggle]");
  var menu = document.querySelector("[data-menu]");
  var modal = document.querySelector("[data-modal]");
  var lastFocusedElement = null;

  function setHeaderState() {
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 8);
  }

  function closeMenu() {
    if (!header || !menuToggle) return;
    header.classList.remove("menu-open");
    menuToggle.classList.remove("is-open");
    menuToggle.setAttribute("aria-expanded", "false");
  }

  function openModal() {
    if (!modal) return;
    lastFocusedElement = document.activeElement;
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
    var firstInput = modal.querySelector("input[name='name']");
    setTimeout(function () {
      if (firstInput) firstInput.focus();
    }, 50);
  }

  function closeModal() {
    if (!modal) return;
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
    if (lastFocusedElement && typeof lastFocusedElement.focus === "function") {
      lastFocusedElement.focus();
    }
  }

  function setStatus(form, message, type) {
    var status = form.querySelector(".form-status");
    if (!status) return;
    status.textContent = message || "";
    status.classList.remove("is-success", "is-error");
    if (type) status.classList.add("is-" + type);
  }

  function clearErrors(form) {
    form.querySelectorAll(".is-invalid").forEach(function (node) {
      node.classList.remove("is-invalid");
    });
  }

  function markInvalid(field) {
    var wrapper = field.closest("label") || field;
    wrapper.classList.add("is-invalid");
  }

  function isEmailValid(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  function validateForm(form) {
    clearErrors(form);
    var name = form.elements.name;
    var phone = form.elements.phone;
    var email = form.elements.email;
    var consent = form.elements.consent;
    var errors = [];

    if (!name || !name.value.trim()) {
      errors.push("Укажите имя.");
      if (name) markInvalid(name);
    }

    if (!phone || !phone.value.trim()) {
      errors.push("Укажите телефон.");
      if (phone) markInvalid(phone);
    }

    if (email && email.value.trim() && !isEmailValid(email.value.trim())) {
      errors.push("Проверьте email.");
      markInvalid(email);
    }

    if (!consent || !consent.checked) {
      errors.push("Нужно согласие с политикой конфиденциальности.");
      if (consent) markInvalid(consent);
    }

    if (errors.length) {
      setStatus(form, errors[0], "error");
      return false;
    }

    return true;
  }

  function enrichFormData(form, formData) {
    formData.set("subscribe_cases", form.elements.subscribe_cases && form.elements.subscribe_cases.checked ? "yes" : "no");
    formData.set("consent", form.elements.consent && form.elements.consent.checked ? "yes" : "no");
  }


  function handleSubmit(event) {
    event.preventDefault();
    var form = event.currentTarget;
    var button = form.querySelector(".submit-btn");

    if (!validateForm(form)) return;

    var formData = new FormData(form);
    enrichFormData(form, formData);

    var submitUrl = "https://script.google.com/macros/s/AKfycbyYb11R_ejlh2gFCNRYSU58atJzNe_8k9nWtFyMOD3iIs06Xg_EBMgcWGOOhaTm9nlpbA/exec";

    if (button) {
      button.disabled = true;
      button.dataset.originalText = button.textContent;
      button.textContent = "Отправляем...";
    }
    setStatus(form, "", null);

    const data = Object.fromEntries(formData.entries());
    data.subscribe_cases = form.elements.subscribe_cases?.checked ? "yes" : "no";
    data.consent = form.elements.consent?.checked ? "yes" : "no";

    fetch(submitUrl, {
      method: "POST",
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(data)
    })
      .then(response => response.json())
      .then(data => {
        if (data.ok) {
          form.reset();
          const subscribe = form.elements.subscribe_cases;
          if (subscribe) subscribe.checked = true;
          setStatus(form, "Заявка отправлена. Мы свяжемся с вами и подтвердим участие.", "success");
        } else {
          setStatus(form, data.error || "Не удалось отправить заявку.", "error");
        }
      })
      .catch(error => {
        setStatus(form, "Не удалось отправить заявку. Проверьте подключение и попробуйте еще раз.", "error");
      })
      .finally(() => {
        if (button) {
          button.disabled = false;
          button.textContent = button.dataset.originalText || "Отправить заявку";
        }
      });
  }

  setHeaderState();
  window.addEventListener("scroll", setHeaderState, { passive: true });

  if (menuToggle && header) {
    menuToggle.addEventListener("click", function () {
      var isOpen = header.classList.toggle("menu-open");
      menuToggle.classList.toggle("is-open", isOpen);
      menuToggle.setAttribute("aria-expanded", String(isOpen));
    });
  }

  if (menu) {
    menu.addEventListener("click", function (event) {
      if (event.target.closest("a")) closeMenu();
    });
  }

  document.querySelectorAll("a[href^='#']").forEach(function (anchor) {
    anchor.addEventListener("click", function (event) {
      var id = anchor.getAttribute("href");
      if (!id || id === "#") return;
      var target = document.querySelector(id);
      if (!target) return;
      event.preventDefault();
      closeMenu();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      history.pushState(null, "", id);
    });
  });

  document.querySelectorAll("[data-modal-open]").forEach(function (button) {
    button.addEventListener("click", openModal);
  });

  document.querySelectorAll("[data-modal-close]").forEach(function (button) {
    button.addEventListener("click", closeModal);
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      closeMenu();
      closeModal();
    }
  });

  document.querySelectorAll(".lead-form").forEach(function (form) {
    form.addEventListener("submit", handleSubmit);
  });
})();
