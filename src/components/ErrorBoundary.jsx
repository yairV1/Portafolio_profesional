import { Component } from 'react'

// Aísla fallos de widgets no esenciales (como el chat) para que un error ahí
// no tumbe el resto del sitio.
export default class ErrorBoundary extends Component {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info)
  }

  render() {
    return this.state.hasError ? null : this.props.children
  }
}
