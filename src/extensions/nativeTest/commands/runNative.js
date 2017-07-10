import log from '../../../utils/log'

export default function runNative (context) {
  context.document.showMessage('running native framework')

  if (NSClassFromString('NativeFramework') != null) {
    log('already have framework loaded')
  } else {
    var pluginBundle = NSBundle.bundleWithURL(context.plugin.url())
    var mocha = Mocha.sharedRuntime()
    if (mocha.loadFrameworkWithName_inDirectory('NativeFramework', pluginBundle.resourceURL().path())) {
      log('LOADED')
    } else {
      log('ERROR LOADING')
    }
  }

  NativeFramework.start()

  NativeFramework.doItWithACallback(function () {
    log('THIS IS FROM THE CALLBACK IN JS')

    return 'All works!'
  })
}
