import Foundation
import CoreGraphics

enum PanelPlacement {
    static func frame(size: CGSize, anchor: CGRect, visibleFrame: CGRect) -> CGRect {
        let width = min(size.width, visibleFrame.width)
        let height = min(size.height, visibleFrame.height)
        let x = min(max(anchor.minX, visibleFrame.minX), visibleFrame.maxX - width)
        let below = anchor.minY - height - 10
        let preferredY = below >= visibleFrame.minY ? below : anchor.maxY + 10
        let y = min(max(preferredY, visibleFrame.minY), visibleFrame.maxY - height)
        return CGRect(x: x, y: y, width: width, height: height)
    }
}
