import { openApp as doOpenApp } from '../utils/oco-sketch'

export default function openApp (context) {
  if (!doOpenApp()) {
    context.document.showMessage('⛈ Could not start Open Color App')
  }
}
