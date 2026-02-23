import { motion } from 'framer-motion';
import { Heart, Clock, MapPin, Phone, Sparkles } from 'lucide-react';

const AboutSection = () => {
  return (
    <section id="about" className="relative section-padding overflow-hidden">
      <div className="absolute inset-0 bg-gradient-warm" />

      <div className="container mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12 sm:mb-16"
        >
          <span className="text-primary/70 text-xs font-medium uppercase tracking-[0.25em] mb-3 block">Our Story</span>
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-3">
            About <span className="text-gradient-gold">ZoyaBites</span>
          </h2>
          <div className="divider-ornament max-w-xs mx-auto mt-5">
            <Sparkles className="w-3.5 h-3.5 text-primary/30" />
          </div>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-10 sm:gap-12 items-start">
          {/* Story */}
          <motion.div
            initial={{ opacity: 0, x: -25 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <p className="text-foreground/60 leading-relaxed mb-5 text-base sm:text-lg font-accent italic">
              "Ghar jaisa khana, pyaar se bana — yahi hai ZoyaBites ka vaada."
            </p>
            <p className="text-muted-foreground leading-relaxed mb-3 text-sm">
              ZoyaBites ek chhota sa sapna tha jo ab aapke ghar tak pahunchta hai. Humara maqsad hai aapko taza, swaadisht aur ghar jaisa khana dena — woh bhi affordable prices mein.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-6 text-sm">
              Dal Chawal ho ya Chicken Chowmein, Rolls ho ya meetha — har cheez fresh banti hai, hygienic kitchen mein, aapke order ke baad. Koi purana khana nahi, koi shortcut nahi — sirf quality aur taste.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-card/50 border border-border p-4 text-center">
                <Heart className="w-5 h-5 text-secondary/70 mx-auto mb-2" />
                <p className="text-sm font-semibold text-foreground">Made with Love</p>
                <p className="text-xs text-muted-foreground">Ghar jaisa taste</p>
              </div>
              <div className="rounded-xl bg-card/50 border border-border p-4 text-center">
                <Clock className="w-5 h-5 text-primary/70 mx-auto mb-2" />
                <p className="text-sm font-semibold text-foreground">Always Fresh</p>
                <p className="text-xs text-muted-foreground">Order ke baad banta hai</p>
              </div>
            </div>
          </motion.div>

          {/* Contact card */}
          <motion.div
            initial={{ opacity: 0, x: 25 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="space-y-4"
          >
            <div className="rounded-2xl bg-card/50 border border-border p-6 sm:p-8">
              <h3 className="font-display text-xl font-semibold text-foreground mb-5">Humse Judein</h3>

              <div className="space-y-4">
                {[
                  { icon: MapPin, title: 'Location', desc: 'Zoyalegal Services, 57, Guru Govind Singh Marg, Maqbool Ganj, Lalkuan, Lucknow, Uttar Pradesh 226001' },
                  { icon: Phone, title: 'Contact', desc: 'WhatsApp par order karein ya call karein' },
                  { icon: Clock, title: 'Timing', desc: '11:00 AM – 10:00 PM (Daily)' },
                ].map(({ icon: Icon, title, desc }) => (
                  <div key={title} className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-primary/8 border border-primary/12 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4 text-primary/60" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{title}</p>
                      <p className="text-xs text-muted-foreground">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl bg-card/30 border border-border/50 p-4 text-center">
              <p className="font-accent italic text-foreground/40 text-sm sm:text-base">
                "Khana wahi jo dil se bane, aur pyaar se parose jaaye"
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
