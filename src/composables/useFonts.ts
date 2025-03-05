import WebFont from 'webfontloader'

export function useFonts() {
    const cachedFonts: string[] = []

    function loadFont(fontFamily: string) {
        if (!fontFamily || cachedFonts.includes(fontFamily)) {
            return
        }

        WebFont.load({
            google: { families: [`${fontFamily}:100,200,300,400,500,600,700,800,900`], api: 'https://fonts.bunny.net/css' },
            fontloading: (familyName: string) => {
                cachedFonts.push(familyName)
            },
            classes: false,
        })
    }

    return {
        loadFont
    }
}