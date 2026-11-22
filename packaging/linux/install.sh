#!/usr/bin/env sh
# Installs SandraMine for the current user (no sudo): binary, menu entry and icons.
#
#   ./install.sh                 -> ~/.local/bin, ~/.local/share/{applications,icons}
#   PREFIX=/usr/local sudo -E ./install.sh   -> system-wide
#   ./install.sh --uninstall     -> removes what was installed
#
# Works from the extracted release .tar.gz or from a source checkout (after `cargo build --release`).
set -eu

PREFIX="${PREFIX:-$HOME/.local}"
BIN_DIR="$PREFIX/bin"
APP_DIR="$PREFIX/share/applications"
ICON_DIR="$PREFIX/share/icons/hicolor"
SIZES="16 22 24 32 48 64 128 256 512"
HERE="$(cd "$(dirname "$0")" && pwd)"

refresh() {
    command -v update-desktop-database >/dev/null 2>&1 && update-desktop-database -q "$APP_DIR" || true
    command -v gtk-update-icon-cache >/dev/null 2>&1 && gtk-update-icon-cache -q -t "$ICON_DIR" || true
    command -v kbuildsycoca6 >/dev/null 2>&1 && kbuildsycoca6 >/dev/null 2>&1 || true
    command -v kbuildsycoca5 >/dev/null 2>&1 && kbuildsycoca5 >/dev/null 2>&1 || true
}

if [ "${1:-}" = "--uninstall" ]; then
    rm -f "$BIN_DIR/sandra-mine" "$APP_DIR/sandra-mine.desktop"
    for n in $SIZES; do rm -f "$ICON_DIR/${n}x${n}/apps/sandra-mine.png"; done
    refresh
    echo "SandraMine removed from $PREFIX (config kept in ~/.config/sandra-mine)."
    exit 0
fi

# Release tarball layout: everything next to this script. Source checkout: repo layout.
if [ -f "$HERE/sandra-mine" ]; then
    BIN="$HERE/sandra-mine"; DESKTOP="$HERE/sandra-mine.desktop"; ICONS="$HERE/icons"
else
    ROOT="$(cd "$HERE/../.." && pwd)"
    BIN="$ROOT/target/release/sandra-mine"; DESKTOP="$HERE/sandra-mine.desktop"; ICONS="$ROOT/assets/icon/linux"
fi
[ -x "$BIN" ] || { echo "sandra-mine binary not found at $BIN (run: cargo build --release)" >&2; exit 1; }

install -Dm755 "$BIN" "$BIN_DIR/sandra-mine"
# Absolute Exec so the menu entry works even if $BIN_DIR is not on PATH.
mkdir -p "$APP_DIR"
sed "s|^Exec=.*|Exec=$BIN_DIR/sandra-mine|" "$DESKTOP" > "$APP_DIR/sandra-mine.desktop"
chmod 644 "$APP_DIR/sandra-mine.desktop"
for n in $SIZES; do
    install -Dm644 "$ICONS/sandra-mine-$n.png" "$ICON_DIR/${n}x${n}/apps/sandra-mine.png"
done
refresh
echo "SandraMine installed in $PREFIX. Open it from the application menu or run: $BIN_DIR/sandra-mine"
