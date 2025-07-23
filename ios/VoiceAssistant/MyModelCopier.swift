// MyModelCopier.swift
import ExpoModulesCore

public class MyModelCopierModule: Module {
  public func definition() -> ModuleDefinition {
    Name("MyModelCopier")

    // Function to copy the model and return the new path
    AsyncFunction("copyModelFromBundle") { (filename: String, promise: Promise) in
      guard let bundlePath = Bundle.main.path(forResource: filename, ofType: nil) else {
        promise.reject("E_MODEL_NOT_FOUND", "Model '\(filename)' not found in the app bundle.")
        return
      }
      
      let documentsDirectory = try FileManager.default.url(for: .documentDirectory, in: .userDomainMask, appropriateFor: nil, create: true)
      let destinationURL = documentsDirectory.appendingPathComponent(filename)
      
      // If file already exists, just return the path
      if FileManager.default.fileExists(atPath: destinationURL.path) {
          promise.resolve(destinationURL.path)
          return
      }

      do {
        try FileManager.default.copyItem(atPath: bundlePath, toPath: destinationURL.path)
        promise.resolve(destinationURL.path)
      } catch {
        promise.reject("E_COPY_FAILED", "Failed to copy model: \(error.localizedDescription)")
      }
    }
  }
}