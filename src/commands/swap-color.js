import { COLOR_TYPES, getColorLookupForLayer } from '../utils/oco-sketch'
import { createAlert, createLabel } from '../utils/sketch-ui'
import { layersWithChildren } from '../utils/sketch-dom'
import updateColors from './update-colors'

export default function swapColor (context) {
  if (!context.selection.count()) {
    context.document.showMessage('Select layers first.')
    return
  }

  var colorLookup = getColorLookupForLayer(context.command, context.selection.firstObject())

  if (!colorLookup) {
    context.document.showMessage('⛈ Connect Artboard with Palette, first.')
    return
  }

  var alert = createAlert('Swap Color', 'Find and Replaces all assigned color names', 'icon.png')
  var listView = NSView.alloc().initWithFrame(NSMakeRect(0, 0, 300, 60))

  var searchTextField = NSTextField.alloc().initWithFrame(NSMakeRect(80, 30, 200, 22))
  listView.addSubview(createLabel('Find', NSMakeRect(0, 30, 80, 22), 12, true))
  listView.addSubview(searchTextField)

  var replaceTextField = NSTextField.alloc().initWithFrame(NSMakeRect(80, 0, 200, 22))
  listView.addSubview(createLabel('Replace', NSMakeRect(0, 0, 80, 22), 12, true))
  listView.addSubview(replaceTextField)

  alert.addAccessoryView(listView)

  alert.addButtonWithTitle('Find, Replace & Update Colors')
  alert.addButtonWithTitle('Cancel')

  var responseCode = alert.runModal()
  if (responseCode != '1000') { // eslint-disable-line eqeqeq
    return
  }

  var searchTerm = searchTextField.stringValue()
  if (searchTerm[0] == '/') {
    try {
      searchTerm = new RegExp(searchTerm.replace('/', ''))
    } catch(e) {
      context.document.showMessage('Invalid regexp')
      return
    }
  }
  var replaceTerm = replaceTextField.stringValue()
  var selectionWithChildren = layersWithChildren(context.selection)
  var changes = []
  var replacementCounts = 0

  selectionWithChildren.forEach(function (layer) {
    var replacements = []
    COLOR_TYPES.forEach(function (styleType) {
      var existingValue = context.command.valueForKey_onLayer('oco_defines_' + styleType, layer)

      if (!existingValue) {
        return
      }
      var info = {
        style: styleType,
        from: existingValue,
        error: false
      }
      var newValue = existingValue.replace(searchTerm, replaceTerm)
      info.to = newValue
      if (Object.keys(colorLookup).indexOf(newValue) === -1) {
        info.error = 'Not in palette'
      } else {
        context.command.setValue_forKey_onLayer(String(newValue), 'oco_defines_' + styleType, layer)
      }

      replacements.push(info)
    })
    replacementCounts += replacements.length
    if (replacements.length) {
      changes.push({
        layer: layer.name(),
        replacements: replacements
      })
    }
  })

  var title = `Swapped ${replacementCounts} values in ${changes.length} Layers (while searching in ${selectionWithChildren.length} layers).`
  var details = 'Replacements:\n\n'
  var errors = {}

  updateColors(context)

  changes.forEach(function (info) {
    info.replacements.forEach(function (replacementInfo) {
      if (replacementInfo.error) {
        errors[info.layer] = errors[info.layer] || []
        errors[info.layer].push(replacementInfo)
      }
    })
  })

  if (Object.keys(errors).length === 0) {
    context.document.showMessage(`🌈 ${title}`)
  } else {
    Object.keys(errors).forEach(function (key) {
      details += key + '\n'
      errors[key].forEach(function (replacementInfo) {
        details += '🚨 ' + replacementInfo.error
        details += ' › ' + replacementInfo.from + ' › ' + replacementInfo.to + '\n'
        details += '\n'
      })
      var alert = createAlert(title, details, 'icon.png')
      alert.addButtonWithTitle('Done!')
      alert.runModal()
    })
  }
}
