'use client';

import { motion } from 'framer-motion';
import { MailCheck, Sparkles } from 'lucide-react';

export default function EmailSentCard() {
  return (
    <div className="">
      
      <motion.div
        initial={{ opacity: 0, scale: 0.85, y: 40 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{
          duration: 0.7,
          ease: 'easeOut',
        }}
        className="
          relative
          overflow-hidden
          w-full
          max-w-md
          rounded-3xl
          bg-white/80
          backdrop-blur-xl
          shadow-2xl
          border border-white/40
          p-8
        "
      >
        {/* Animated Glow */}
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.4, 0.7, 0.4],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
          }}
          className="
            absolute
            -top-20
            -right-20
            h-52
            w-52
            rounded-full
            bg-indigo-400/30
            blur-3xl
          "
        />

        {/* Floating Sparkles */}
        <motion.div
          animate={{
            y: [-10, 10, -10],
            rotate: [0, 10, 0],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
          }}
          className="absolute top-6 right-6 text-purple-500"
        >
          <Sparkles size={28} />
        </motion.div>

        {/* Mail Animation */}
        <div className="flex justify-center mb-6">
          <motion.div
            initial={{ rotate: -10 }}
            animate={{
              rotate: [0, -6, 6, -6, 0],
              y: [0, -6, 0],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
            }}
            className="
              relative
              h-28
              w-28
              rounded-full
              bg-gradient-to-br
              from-indigo-500
              to-purple-600
              flex
              items-center
              justify-center
              shadow-xl
            "
          >
            {/* Pulse Ring */}
            <motion.div
              animate={{
                scale: [1, 1.6],
                opacity: [0.5, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
              }}
              className="
                absolute
                inset-0
                rounded-full
                border-4
                border-indigo-400
              "
            />

            <MailCheck
              size={52}
              className="text-white"
            />
          </motion.div>
        </div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.3,
          }}
          className="text-center"
        >
          <h1
            className="
              text-3xl
              font-extrabold
              text-gray-900
              mb-3
            "
          >
            Email Sent 🎉
          </h1>

          <p
            className="
              text-gray-600
              leading-relaxed
              text-sm
              sm:text-base
            "
          >
            We’ve successfully sent your
            password reset link to your email.
          </p>

          <p
            className="
              mt-3
              text-xs
              text-gray-400
            "
          >
            Please check your inbox and spam folder.
          </p>
        </motion.div>

        {/* Animated Progress */}
        <div className="mt-8">
          <div
            className="
              h-2
              w-full
              overflow-hidden
              rounded-full
              bg-gray-200
            "
          >
            <motion.div
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{
                duration: 3,
                repeat: Infinity,
              }}
              className="
                h-full
                rounded-full
                bg-gradient-to-r
                from-indigo-500
                to-purple-500
              "
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
}