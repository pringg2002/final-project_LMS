const EYE = `
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
    >
        <path
            d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"
        />
        <circle cx="12" cy="12" r="3"/>
    </svg>
`;

const EYE_OFF = `
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
    >
        <path d="M3 3l18 18"/>
        <path
            d="M10.6 5.1A11.6 11.6 0 0 1 12 5c6.5 0 10 7 10 7a15.8 15.8 0 0 1-3.2 4.1"
        />
        <path
            d="M6.2 6.2C3.5 8.2 2 12 2 12s3.5 7 10 7a10.7 10.7 0 0 0 4.2-.8"
        />
        <path d="M10 10a3 3 0 0 0 4 4"/>
    </svg>
`;

const toggleButtons =
    document.querySelectorAll(".toggle-password");

toggleButtons.forEach((button) => {

    const inputId =
        button.getAttribute("aria-controls");

    const passwordInput =
        document.getElementById(inputId);

    if (!passwordInput) return;

    button.addEventListener("click", () => {

        const isHidden =
            passwordInput.type === "password";

        if (isHidden) {

            passwordInput.type = "text";

            button.innerHTML = EYE_OFF;

            button.setAttribute(
                "aria-label",
                "Hide password"
            );

            button.setAttribute(
                "aria-pressed",
                "true"
            );

        } else {

            passwordInput.type = "password";

            button.innerHTML = EYE;

            button.setAttribute(
                "aria-label",
                "Show password"
            );

            button.setAttribute(
                "aria-pressed",
                "false"
            );
        }

    });

});