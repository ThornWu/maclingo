import XCTest
import CoreGraphics
@testable import MacLingoCore

final class CoreTests: XCTestCase {
    func testSelectionIsTrimmedAndAutomaticSourceIsNil() throws {
        let request = try TranslationRequest(text: " \n Hello world  ", source: "", target: "zh-Hans")
        XCTAssertEqual(request.text, "Hello world")
        XCTAssertNil(request.source)
    }
    func testRejectEmptyAndOverlongButAcceptLimit() throws {
        XCTAssertThrowsError(try TranslationRequest(text: "\n \t", source: nil, target: "en"))
        XCTAssertThrowsError(try TranslationRequest(text: String(repeating: "字", count: 10_001), source: nil, target: "en"))
        XCTAssertEqual(try TranslationRequest(text: String(repeating: "字", count: 10_000), source: nil, target: "en").text.count, 10_000)
    }
    func testLatestRequestWinsEvenForSameTextAndPair() throws {
        let first = try TranslationRequest(text: "Hello", source: "en", target: "zh-Hans")
        let second = try TranslationRequest(text: "Hello", source: "en", target: "zh-Hans")
        var gate = RequestGate()
        gate.begin(first)
        gate.begin(second)
        XCTAssertFalse(gate.accepts(first.id))
        XCTAssertTrue(gate.accepts(second.id))
    }
    func testDismissalRejectsOutstandingResult() throws {
        let request = try TranslationRequest(text: "Hello", source: nil, target: "zh-Hans")
        var gate = RequestGate()
        gate.begin(request)
        gate.cancel()
        XCTAssertFalse(gate.accepts(request.id))
    }
    func testPlacementClampsToSecondaryScreenAndFallsAboveSelection() {
        let screen = CGRect(x: -1440, y: 0, width: 1440, height: 900)
        let frame = PanelPlacement.frame(size: CGSize(width: 460, height: 460), anchor: CGRect(x: -50, y: 10, width: 20, height: 20), visibleFrame: screen)
        XCTAssertEqual(frame.minX, -460)
        XCTAssertEqual(frame.minY, 40)
        XCTAssertTrue(screen.contains(frame))
    }
    func testPlacementFitsSmallScreen() {
        let screen = CGRect(x: 0, y: 0, width: 320, height: 240)
        let frame = PanelPlacement.frame(size: CGSize(width: 460, height: 460), anchor: CGRect(x: 600, y: 600, width: 0, height: 0), visibleFrame: screen)
        XCTAssertEqual(frame, screen)
    }
}
