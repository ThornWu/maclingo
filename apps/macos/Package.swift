// swift-tools-version: 6.0
import PackageDescription

let package = Package(
    name: "MacLingoCore",
    platforms: [.macOS(.v15)],
    products: [.library(name: "MacLingoCore", targets: ["MacLingoCore"])],
    targets: [
        .target(name: "MacLingoCore", path: "MacLingo/Core"),
        .testTarget(name: "MacLingoCoreTests", dependencies: ["MacLingoCore"], path: "MacLingoTests")
    ]
)
