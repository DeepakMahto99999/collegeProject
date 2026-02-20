import React from 'react';
import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';
import { testimonials } from '@/utils/dummyData';

const Testimonials = () => {
  return (
    <section className="py-16">
      <div className="text-center mb-12">
        <h2 className="font-display text-3xl font-bold mb-4">
          Loved by <span className="gradient-text">Focused Learners</span>
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Join thousands of students and professionals who have transformed their YouTube experience
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {testimonials.map((testimonial, index) => (
          <motion.div
            key={testimonial.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
            viewport={{ once: true }}
            className="glass-card rounded-xl p-6 relative"
          >
            <div className="absolute top-4 right-4 text-primary/20">
              <Quote className="h-8 w-8" />
            </div>

            <div className="flex items-center gap-1 mb-4">
              {Array.from({ length: testimonial.rating }).map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-warning text-warning" />
              ))}
            </div>

            <p className="text-foreground mb-6 leading-relaxed">
              "{testimonial.content}"
            </p>

            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-2xl">
                {testimonial.avatar}
              </div>
              <div>
                <p className="font-semibold text-foreground">{testimonial.name}</p>
                <p className="text-sm text-muted-foreground">{testimonial.role}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default Testimonials;
