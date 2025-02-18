import './styles.css'

function SignupButton() {
  return (
    <div className="buttons-wrapper">
      <a href="https://codebrew.authui.site/">
        <button className="auth-button">
          Sign In
        </button>
      </a>
      <a href="https://codebrew.authui.site/sign-up">
        <button className="auth-button">
          Sign Up
        </button>
      </a>
    </div>
  )
}

export default SignupButton