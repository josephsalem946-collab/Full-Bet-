package com.fullbet.app.ui.theme

import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.TextUnit
import androidx.compose.ui.unit.sp

/**
 * =========================================================================
 * GID OFISYÈL TIPOGRAFI FULL BET (Inite sp nan Jetpack Compose)
 * =========================================================================
 *
 * 1. 20.sp a 24.sp (Gwo Tit / Headers):
 *    Sèvi ak sa sèlman pou non aplikasyon an nan tèt paj la oswa gwo tit prensipal
 *    yo pou yo pa pran twòp plas.
 *
 * 2. 16.sp a 18.sp (Tèks Nòmal / Body Text):
 *    Bon nèt pou paragraf oswa enfòmasyon enpòtan ke w vle itilizatè a li fasil
 *    san efò.
 *
 * 3. 14.sp (Tit pou Modèl yo / Card Titles):
 *    Ideyal pou mete sou non jwèt yo (tankou American Roulette oswa Aviator)
 *    anndan yon modèl oswa yon kat.
 *
 * 4. 11.sp a 12.sp (Ti Detay / Subtitles):
 *    Pafè pou estati, dat, oswa ti deskripsyon anba tit yo pou tout bagay rete
 *    byen òganize nan bwat la san l pa kase.
 *
 * 5. 10.sp (Trè Ti Tèks / Captions):
 *    Itilize l pou enfòmasyon anplis ki pa twò enpòtan men ki dwe la (tankou
 *    nimewo vèsyon oswa ti nòt).
 *
 * Kòman pou evite debòde (Overflow):
 * - Toujou sèvi ak ti gwosè (11.sp a 14.sp) pou eleman ki anndan ti modèl ki gen anpil tèks.
 * - maxLines = 1 ak overflow = TextOverflow.Ellipsis
 */
object FullBetSp {
    // 1. Gwo Tit / Headers (20.sp a 24.sp)
    val HeaderLarge: TextUnit = 24.sp
    val HeaderAppTitle: TextUnit = 20.sp

    // 2. Tèks Nòmal / Body Text (16.sp a 18.sp)
    val BodyPrimary: TextUnit = 18.sp
    val BodyRegular: TextUnit = 16.sp

    // 3. Tit pou Modèl yo / Card Titles (14.sp)
    val CardGameTitle: TextUnit = 14.sp

    // 4. Ti Detay / Subtitles (11.sp a 12.sp)
    val SubtitleStatus: TextUnit = 12.sp
    val SubtitleSmall: TextUnit = 11.sp

    // 5. Trè Ti Tèks / Captions (10.sp)
    val CaptionNote: TextUnit = 10.sp
    val TinyBadge: TextUnit = 9.sp
}
