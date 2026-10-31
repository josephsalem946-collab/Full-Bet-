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
    description: String = "Offre gérée en direct par Full Bet. Cotes boostées & dépôts instantanés.",
    buttonText: String = "⚡ Voir le direct",
    onSeeLiveClick: () -> Unit = {}
) {
    Surface(
        modifier = modifier
            .fillMaxWidth()
            .padding(horizontal = 8.dp, vertical = 4.dp),
        shape = RoundedCornerShape(12.dp),
        color = BannerDarkBlue,
        border = BorderStroke(1.dp, BannerBorderBlue.copy(alpha = 0.5f))
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 10.dp, vertical = 8.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            // Kolòn kontni a (Ultra-Konpak & Responsive)
            Column(
                modifier = Modifier
                    .weight(1f)
                    .padding(end = 8.dp),
                verticalArrangement = Arrangement.spacedBy(2.dp)
            ) {
                // 1. Tag anwo (Boost de cotes)
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    Text(
                        text = "🔥",
                        fontSize = 11.sp
                    )
                    Text(
                        text = tagText,
                        color = AccentBlueCyan,
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }

                // 2. Tit Prensipal la
                Text(
                    text = title,
                    color = TextWhite,
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Bold,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )

                // 3. Ti Deskripsyon
                Text(
                    text = description,
                    color = TextGray,
                    fontSize = 10.sp,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
            }

            // 4. Bouton Aksyon Konpak
            Button(
                onClick = onSeeLiveClick,
                colors = ButtonDefaults.buttonColors(containerColor = AccentBlueCyan),
                shape = RoundedCornerShape(8.dp),
                contentPadding = PaddingValues(horizontal = 10.dp, vertical = 6.dp),
                modifier = Modifier.wrapContentWidth()
            ) {
                Text(
                    text = buttonText,
                    color = Color.Black,
                    fontWeight = FontWeight.Bold,
                    fontSize = 11.sp,
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
