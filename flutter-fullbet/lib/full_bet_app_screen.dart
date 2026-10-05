import 'package:flutter/material.dart';

class FullBetAppScreen extends StatelessWidget {
  const FullBetAppScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF4F7FB),
      body: SafeArea(
        child: Column(
          children: [
            // 1. Liy anwo a (Header)
            _buildHeader(),
            
            // 2. Kat Match la
            _buildMatchCard(),
          ],
        ),
      ),
    );
  }

  // Fonksyon Header a
  Widget _buildHeader() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      color: const Color(0xFF0b132b),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          const Text(
            "FULL BET",
            style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
          ),
          Row(
            children: [
              OutlinedButton.icon(
                onPressed: () {},
                icon: const Icon(Icons.list_alt, color: Color(0xFFffb703), size: 16),
                label: const Text("Fiches", style: TextStyle(color: Color(0xFFffb703))),
                style: OutlinedButton.styleFrom(
                  side: const BorderSide(color: Color(0xFFffb703)),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                ),
              ),
              const SizedBox(width: 8),
              IconButton(
                onPressed: () {},
                icon: const Icon(Icons.print, color: Color(0xFFffb703)),
                tooltip: "Enprime fiches",
              ),
            ],
          ),
        ],
      ),
    );
  }

  // Fonksyon Kat Match la
  Widget _buildMatchCard() {
    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Colors.white, Color(0xFFF0F4F8)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20), // Kwen yo pi awondi
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF0b132b).withOpacity(0.12),
            blurRadius: 20,
            offset: const Offset(0, 6),
          ),
        ],
        border: Border.all(color: Colors.black.withOpacity(0.04)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: const [
              Text(
                "Ligue des Champions • Europe",
                style: TextStyle(color: Colors.grey, fontSize: 12, fontWeight: FontWeight.bold),
              ),
              Container(
                padding: EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: Color(0xFFd90429), // Wouj klere pou dirèk
                  borderRadius: BorderRadius.all(Radius.circular(12)),
                ),
                child: Text(
                  "68'",
                  style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: const [
              Text("Real Madrid", style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF0b132b))),
              Text("2", style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: Color(0xFFb5830d))), // Jòn lò ki kanpe soti
            ],
          ),
          const SizedBox(height: 6),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: const [
              Text("Manchester City", style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF0b132b))),
              Text("1", style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: Color(0xFFb5830d))), // Jòn lò ki kanpe soti
            ],
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(child: _buildOddBox("REA", "2.15")),
              const SizedBox(width: 8),
              Expanded(child: _buildOddBox("NUL", "3.40")),
              const SizedBox(width: 8),
              Expanded(child: _buildOddBox("MAN", "3.20")),
            ],
          ),
        ],
      ),
    );
  }

  // Bwat Kòt yo ak lonbraj
  Widget _buildOddBox(String label, String value) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 8),
      decoration: BoxDecoration(
        color: const Color(0xFF0b132b),
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF0b132b).withOpacity(0.2),
            blurRadius: 8,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: [
          Text(label, style: const TextStyle(color: Color(0xFF8d99ae), fontSize: 11)),
          const SizedBox(height: 4),
          Text(value, style: const TextStyle(color: Color(0xFFffb703), fontSize: 15, fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }
}
