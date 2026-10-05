package com.fullbet.app.ui.components

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.fullbet.app.ui.theme.FullBetSp

// =========================================================================
// KOULÈ OFISYÈL BANYÈ PROMO FULL BET
// =========================================================================
val BannerDarkBlue = Color(0xFF101C38)  // Fond blefonse banyè a
val BannerBorderBlue = Color(0xFF1E88E5) // Koulè kontou ble a
val AccentBlueCyan = Color(0xFF00E5FF)  // Koulè bouton an ak ti tèt la
val TextWhite = Color(0xFFFFFFFF)
val TextGray = Color(0xFF94A3B8)

/**
 * Banyè pwomosyonèl FULL BET (Boost de cotes)
 * 
 * Karakteristik & Koreksyon entegre:
 * - Ajout `import androidx.compose.foundation.BorderStroke` (ki te manke pou ranje erè konpilasyon an).
 * - Aplikasyon Gid Tipografi SP:
 *   • 20.sp : Gwo Tit prensipal la ("Real Madrid vs Manchester City")
 *   • 11.sp a 12.sp : Ti Detay / Subtitles ("BOOST DE COTES +30%", deskripsyon)
 *   • 13.sp a 14.sp : Tèks bouton ("⚡ Voir le direct")
 * - Pwoteksyon Anti-Overflow: maxLines ak TextOverflow.Ellipsis sou chak eleman tèks.
 */
@Composable
fun FullBetPromoBanner(
    modifier: Modifier = Modifier,
    title: String = "Real Madrid vs Manchester City",
    tagText: String = "BOOST DE COTES +30% • LIGUE DES CHAMPIONS",
    description: String = "Offre gérée en direct par Full Bet (fullbet.com). Cotes boostées & dépôts instantanés MonCash / NatCash.",
    buttonText: String = "⚡ Voir le direct",
    onSeeLiveClick: () -> Unit = {}
) {
    Surface(
        modifier = modifier
            .fillMaxWidth()
            .padding(16.dp),
        shape = RoundedCornerShape(16.dp),
        color = BannerDarkBlue,
        border = BorderStroke(1.dp, BannerBorderBlue.copy(alpha = 0.6f))
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            // 1. Tag anwo (Boost de cotes) - 11.sp dapre gid tipografi a
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(6.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Text(
                    text = "🔥",
                    fontSize = 14.sp
                )
                Text(
                    text = tagText,
                    color = AccentBlueCyan,
                    fontSize = FullBetSp.SubtitleSmall, // 11.sp
                    fontWeight = FontWeight.Bold,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                    modifier = Modifier.weight(1f)
                )
            }

            // 2. Gwo Tit Prensipal la - 20.sp dapre gid tipografi a
            Text(
                text = title,
                color = TextWhite,
                fontSize = FullBetSp.HeaderAppTitle, // 20.sp
                fontWeight = FontWeight.Bold,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )

            // 3. Deskripsyon - 12.sp (Ti Detay / Subtitles)
            Text(
                text = description,
                color = TextGray,
                fontSize = FullBetSp.SubtitleStatus, // 12.sp
                maxLines = 2,
                overflow = TextOverflow.Ellipsis
            )

            Spacer(modifier = Modifier.height(4.dp))

            // 4. Bouton "Voir le direct" - 13.sp
            Button(
                onClick = onSeeLiveClick,
                colors = ButtonDefaults.buttonColors(containerColor = AccentBlueCyan),
                shape = RoundedCornerShape(8.dp),
                modifier = Modifier.wrapContentWidth()
            ) {
                Text(
                    text = buttonText,
                    color = Color.Black,
                    fontWeight = FontWeight.Bold,
                    fontSize = 13.sp,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
            }
        }
    }
}

@Preview(showBackground = true, backgroundColor = 0xFF0D1322)
@Composable
fun FullBetPromoBannerPreview() {
    FullBetPromoBanner()
}
